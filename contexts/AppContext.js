'use client';

import React, { createContext, useContext, useReducer } from 'react';
import { mockSkills } from '../data/mockData';

const AppContext = createContext();

const initialState = {
  assessmentCompleted: false,
  userSkills: mockSkills,
  completedDrills: [],
  assessmentAnswers: {},
  currentUser: {
    name: 'Alex Johnson',
    role: 'Sales Representative',
    joinDate: '2024-12-01'
  }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'COMPLETE_ASSESSMENT':
      return {
        ...state,
        assessmentCompleted: true,
        assessmentAnswers: action.payload.answers,
        userSkills: action.payload.calculatedSkills
      };
    case 'COMPLETE_DRILL':
      return {
        ...state,
        completedDrills: [...state.completedDrills, {
          id: action.payload.drillId,
          skillId: action.payload.skillId,
          completedAt: new Date().toISOString(),
          ...action.payload.data
        }]
      };
    case 'UPDATE_SKILL_SCORE':
      return {
        ...state,
        userSkills: state.userSkills.map(skill =>
          skill.id === action.payload.skillId
            ? { ...skill, score: action.payload.newScore }
            : skill
        )
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}