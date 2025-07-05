import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' } : {}}
      className={cn(
        'bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300',
        className
      )}
    >
      {children}
    </motion.div>
  );
};