'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  AlertTriangle, 
  CheckCircle2,
  FileText,
  HardDrive
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { appStorage, isStorageAvailable } from '../utils/localStorage';

export default function DataManager() {
  const { state, dispatch } = useApp();
  const { t } = useLanguage();
  const [exportData, setExportData] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  const handleExportData = () => {
    const data = appStorage.exportData();
    setExportData(data);
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salesmind-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate imported data structure
        if (!importedData.appState || typeof importedData.appState !== 'object') {
          setImportStatus({ type: 'error', message: 'Invalid backup file format' });
          return;
        }

        // Import the data
        const success = appStorage.importData(importedData);
        
        if (success) {
          // Reload the page to apply imported data
          setImportStatus({ type: 'success', message: 'Data imported successfully! Reloading...' });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setImportStatus({ type: 'error', message: 'Failed to import data' });
        }
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Invalid JSON file' });
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      dispatch({ type: 'CLEAR_ALL_DATA' });
      setImportStatus({ type: 'success', message: 'All data cleared successfully' });
    }
  };

  const getStorageInfo = () => {
    if (!isStorageAvailable()) {
      return { available: false, used: 0, total: 0 };
    }

    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // Estimate total available (most browsers allow ~5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate
      
      return {
        available: true,
        used: used,
        total: total,
        percentage: (used / total) * 100
      };
    } catch (error) {
      return { available: false, used: 0, total: 0 };
    }
  };

  const storageInfo = getStorageInfo();
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Storage Status */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5 text-blue-600" />
            <span>Local Storage Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {storageInfo.available ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{formatBytes(storageInfo.used)}</p>
                  <p className="text-sm text-gray-600">Used</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{formatBytes(storageInfo.total)}</p>
                  <p className="text-sm text-gray-600">Available</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage Usage</span>
                  <span>{Math.round(storageInfo.percentage * 100) / 100}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <Badge variant="outline" className="justify-center">
                  Assessment: {state.assessmentCompleted ? 'Saved' : 'Not taken'}
                </Badge>
                <Badge variant="outline" className="justify-center">
                  Drills: {state.completedDrills.length} completed
                </Badge>
                <Badge variant="outline" className="justify-center">
                  Skills: {state.userSkills.length} tracked
                </Badge>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Local storage is not available in your browser. Data will not persist between sessions.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Data Management Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Data */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-green-600" />
              <span>Export Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Download a backup of all your assessment results, completed exercises, and progress data.
            </p>
            <Button 
              onClick={handleExportData}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={!isStorageAvailable()}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Backup
            </Button>
            
            {exportData && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Backup created successfully! File downloaded to your device.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Import Data */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <span>Import Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Restore your data from a previously exported backup file.
            </p>
            <div className="space-y-4">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                disabled={!isStorageAvailable()}
              />
              
              {importStatus && (
                <Alert className={`${
                  importStatus.type === 'success' 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  {importStatus.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={
                    importStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }>
                    {importStatus.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear Data */}
      <Card className="border-0 shadow-lg border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            <span>Clear All Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Permanently delete all stored data including assessment results, completed exercises, and progress. This action cannot be undone.
          </p>
          <Button 
            onClick={handleClearAllData}
            variant="destructive"
            className="w-full"
            disabled={!isStorageAvailable()}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card className="border-0 shadow-lg bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Current Data Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {state.assessmentCompleted ? '✓' : '✗'}
              </p>
              <p className="text-sm text-gray-600">Assessment</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{state.completedDrills.length}</p>
              <p className="text-sm text-gray-600">Completed Drills</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{state.userSkills.length}</p>
              <p className="text-sm text-gray-600">Tracked Skills</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(state.assessmentAnswers).length}
              </p>
              <p className="text-sm text-gray-600">Assessment Answers</p>
            </div>
          </div>
          
          {state.dataLoaded && (
            <div className="mt-4 text-center">
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Data loaded from local storage
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}