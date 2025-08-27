import React from 'react';

interface DiagnosticCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const DiagnosticCard: React.FC<DiagnosticCardProps> = ({ icon, title, children }) => {
  return (
    <div className="relative p-0.5 rounded-3xl liquid-glass overflow-hidden">
        <div className="relative glass-effect rounded-[22px] p-6 h-full">
            <div className="flex items-center mb-4">
                <div className="bg-slate-900/50 p-3 rounded-lg mr-4">
                {icon}
                </div>
                <h3 className="text-xl font-bold text-slate-100">{title}</h3>
            </div>
            <div className="text-slate-300 space-y-1">
                {children}
            </div>
        </div>
    </div>
  );
};

export default DiagnosticCard;