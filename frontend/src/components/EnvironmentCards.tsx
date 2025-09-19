import React from 'react';
import EnvironmentCard from './EnvironmentCard';
import { EnvironmentData } from '../types';

export interface EnvironmentCardsProps {
  environmentData: EnvironmentData | null;
  isLoading?: boolean;
  error?: string;
}

const EnvironmentCards: React.FC<EnvironmentCardsProps> = ({
  environmentData,
  isLoading = false,
  error
}) => {
  // Temperature icon (thermometer)
  const TemperatureIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-2V5c0-.55.45-1 1-1s1 .45 1 1v6h-2z"/>
    </svg>
  );

  // Humidity icon (water drop)
  const HumidityIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/>
    </svg>
  );

  // Light icon (sun/lightbulb)
  const LightIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Temperature Card */}
      <EnvironmentCard
        title="温度"
        value={environmentData?.temperature ?? null}
        unit="°C"
        icon={<TemperatureIcon />}
        colorClass="text-primary-400"
        isLoading={isLoading}
        error={error}
        lastUpdated={environmentData?.timestamp}
      />

      {/* Humidity Card */}
      <EnvironmentCard
        title="湿度"
        value={environmentData?.humidity ?? null}
        unit="%"
        icon={<HumidityIcon />}
        colorClass="text-success-400"
        isLoading={isLoading}
        error={error}
        lastUpdated={environmentData?.timestamp}
      />

      {/* Light Card */}
      <EnvironmentCard
        title="照度"
        value={environmentData?.light ?? null}
        unit="lux"
        icon={<LightIcon />}
        colorClass="text-warning-400"
        isLoading={isLoading}
        error={error}
        lastUpdated={environmentData?.timestamp}
      />
    </div>
  );
};

export default EnvironmentCards;