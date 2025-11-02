
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
