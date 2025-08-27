import React, { useState, useCallback } from 'react';
import { TestResults, TestProgress, TestName, OverallDiagnosis, Rating } from './types';
import { getLocation, getIpInfo, runSpeedTest, getDeviceInfo } from './services/networkService';
import { rateSpeed, rateLocation, rateDevice } from './services/analysisService';
import DiagnosticCard from './components/DiagnosticCard';
import Spinner from './components/Spinner';
import { LocationIcon, PingIcon, IpIcon, DeviceIcon, CheckCircleIcon, XCircleIcon } from './components/Icons';

const initialProgress: TestProgress = {
  location: { status: 'idle' },
  speed: { status: 'idle' },
  ipInfo: { status: 'idle' },
  deviceInfo: { status: 'idle' },
};

const TestStatusIndicator: React.FC<{ status: TestProgress[TestName] }> = ({ status }) => {
  if (status.status === 'running') return <Spinner className="w-6 h-6 text-brand-500" />;
  if (status.status === 'completed') return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
  if (status.status === 'failed') return <XCircleIcon className="w-6 h-6 text-red-400" />;
  return <div className="w-6 h-6 border-2 border-slate-600 rounded-full" />;
};

const RatingBadge: React.FC<{ rating: Rating }> = ({ rating }) => {
  const colorClasses = {
    excellent: 'bg-green-500 text-green-900 border border-green-400/50',
    good: 'bg-brand-500 text-slate-900 border border-brand-500/50',
    average: 'bg-yellow-500 text-yellow-900 border border-yellow-400/50',
    poor: 'bg-orange-500 text-orange-900 border border-orange-400/50',
    fail: 'bg-red-600 text-red-100 border border-red-500/50',
  }[rating.level];

  return (
    <div className={`mb-4 p-4 rounded-xl ${colorClasses} glass-effect`}>
      <span className={`font-bold text-lg`}>{rating.label}</span>
      <p className="text-sm opacity-90">{rating.description}</p>
    </div>
  );
};

// Component for individual metric diagnosis
const DiagnosticItem: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between py-1">
      <strong className="font-semibold text-slate-200">{label}:</strong>
      <span>{value}</span>
    </div>
  );
};

const App: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [progress, setProgress] = useState<TestProgress>(initialProgress);
  const [overallDiagnosis, setOverallDiagnosis] = useState<OverallDiagnosis | null>(null);
  
  const getOverallDiagnosis = (res: TestResults): OverallDiagnosis => {
      let score = 0;
      let issues: string[] = [];

      if (res.deviceInfo?.rating?.level === 'fail') {
          return { title: "Dispositivo no Compatible", description: "Las especificaciones o el sistema operativo de tu dispositivo no son adecuados para la aplicación.", level: 'poor' };
      }
      if (res.speed?.rating) {
          if (res.speed.rating.level === 'excellent') score += 3;
          if (res.speed.rating.level === 'good') score += 2;
          if (res.speed.rating.level === 'average') score += 1;
          if (res.speed.rating.level === 'poor') issues.push('velocidad de red');
      }
      if (res.location?.rating) {
          if (res.location.rating.level === 'excellent' || res.location.rating.level === 'good') score += 1;
          if (res.location.rating.level === 'poor') issues.push('precisión de GPS');
      }

      if (score >= 3) return { title: "Excelente Conexión y Dispositivo", description: "Tu configuración es ideal para operaciones de transporte en tiempo real.", level: 'good' };
      if (score >= 2) return { title: "Configuración Promedio", description: `Tu conexión es funcional, pero podrías experimentar problemas menores. Problemas detectados en: ${issues.join(', ') || 'ninguno'}.`, level: 'average' };
      return { title: "Configuración Deficiente", description: `Tu configuración puede afectar gravemente las operaciones. Problemas críticos detectados en: ${issues.join(', ') || 'varios factores'}.`, level: 'poor' };
  }

  const runTest = async <T,>(testName: TestName, testFn: () => Promise<T>): Promise<T | null> => {
    setProgress(p => ({ ...p, [testName]: { status: 'running' } }));
    try {
      const result = await testFn();
      setProgress(p => ({ ...p, [testName]: { status: 'completed' } }));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setProgress(p => ({ ...p, [testName]: { status: 'failed', error: message } }));
      return null;
    }
  };

  const handleStartTest = useCallback(async () => {
    setIsTesting(true);
    setResults(null);
    setProgress(initialProgress);
    setOverallDiagnosis(null);

    // Device info is synchronous and fast
    const deviceInfoResult = getDeviceInfo();
    const deviceRating = rateDevice(deviceInfoResult);
    setProgress(p => ({ ...p, deviceInfo: { status: 'completed' } }));

    // Run async tests in parallel
    const [locationResult, ipInfoResult, speedResult] = await Promise.all([
      runTest('location', getLocation),
      runTest('ipInfo', getIpInfo),
      runTest('speed', runSpeedTest),
    ]);
    
    const finalResults: TestResults = {
      deviceInfo: { ...deviceInfoResult, rating: deviceRating },
      location: locationResult ? { ...locationResult, rating: rateLocation(locationResult) } : undefined,
      ipInfo: ipInfoResult ?? undefined,
      speed: speedResult ? { ...speedResult, rating: rateSpeed(speedResult) } : undefined,
    };

    setResults(finalResults);
    setOverallDiagnosis(getOverallDiagnosis(finalResults));
    setIsTesting(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 sm:p-8 font-sans">
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 animate-gradient">
            Diagnóstico de Red y Dispositivo
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Un análisis completo de tu conexión y dispositivo con un solo clic.
          </p>
        </header>

        <div className="text-center mb-10">
          <button
            onClick={handleStartTest}
            disabled={isTesting}
            className="bg-brand-500 hover:bg-brand-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-900 font-bold py-3 px-8 rounded-full text-lg shadow-lg shadow-brand-500/40 transform hover:scale-105 transition-all duration-300 ease-in-out flex items-center justify-center mx-auto"
            aria-live="polite"
          >
            {isTesting && <Spinner className="w-6 h-6 mr-3" />}
            {isTesting ? 'Realizando pruebas...' : 'Iniciar Test'}
          </button>
        </div>

        {(isTesting || results) && (
           <div className="relative p-0.5 rounded-3xl liquid-glass overflow-hidden mb-8">
            <div className="relative glass-effect rounded-[22px] p-6">
                <h2 className="text-2xl font-bold mb-4 text-center text-slate-300">Progreso del Test</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {Object.keys(progress).map((key) => (
                    <div key={key} className="flex flex-col items-center space-y-2">
                    <TestStatusIndicator status={progress[key as TestName]} />
                    <span className="capitalize text-slate-400">{key.replace('Info', ' Info')}</span>
                    </div>
                ))}
                </div>
            </div>
          </div>
        )}

        {results && !isTesting && (
          <section aria-labelledby="results-title">
            {overallDiagnosis && (
              <div className={`relative p-0.5 rounded-3xl liquid-glass overflow-hidden mb-8`}>
                <div className={`relative glass-effect rounded-[22px] p-6 border ${
                    overallDiagnosis.level === 'good' ? 'border-brand-500/50' 
                  : overallDiagnosis.level === 'average' ? 'border-yellow-500/50' 
                  : 'border-red-500/50'}`}>
                  <h2 id="results-title" className={`text-2xl font-bold mb-2 ${
                    overallDiagnosis.level === 'good' ? 'text-brand-500' 
                  : overallDiagnosis.level === 'average' ? 'text-yellow-300' 
                  : 'text-red-300'}`}>{overallDiagnosis.title}</h2>
                  <p className="text-slate-300">{overallDiagnosis.description}</p>
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              {results.speed && (
                <DiagnosticCard icon={<PingIcon className="w-8 h-8 text-brand-500"/>} title="Velocidad de Internet">
                  {results.speed.rating && <RatingBadge rating={results.speed.rating} />}
                  <DiagnosticItem
                    label="Descarga"
                    value={<span className="font-mono">{results.speed.downloadSpeed} Mbps</span>}
                  />
                  <DiagnosticItem
                    label="Subida"
                    value={<span className="font-mono">{results.speed.uploadSpeed} Mbps</span>}
                  />
                  <DiagnosticItem
                    label="Latencia"
                    value={<span className="font-mono">{results.speed.latency} ms</span>}
                  />
                </DiagnosticCard>
              )}

              {results.location && (
                <DiagnosticCard icon={<LocationIcon className="w-8 h-8 text-brand-500"/>} title="Ubicación">
                  {results.location.rating && <RatingBadge rating={results.location.rating} />}
                  <DiagnosticItem
                    label="Latitud"
                    value={<span className="font-mono">{results.location.latitude.toFixed(4)}</span>}
                  />
                  <DiagnosticItem
                    label="Longitud"
                    value={<span className="font-mono">{results.location.longitude.toFixed(4)}</span>}
                  />
                  <DiagnosticItem
                    label="Precisión"
                    value={<span className="font-mono">{results.location.accuracy.toFixed(0)} metros</span>}
                  />
                </DiagnosticCard>
              )}

              {results.deviceInfo && (
                <DiagnosticCard icon={<DeviceIcon className="w-8 h-8 text-brand-500"/>} title="Información del Dispositivo">
                  {results.deviceInfo.rating && <RatingBadge rating={results.deviceInfo.rating} />}
                  <DiagnosticItem
                      label="Navegador"
                      value={<span>{results.deviceInfo.browser}</span>}
                  />
                  <DiagnosticItem
                      label="Sistema Operativo"
                      value={<span>{results.deviceInfo.os} {results.deviceInfo.osVersion}</span>}
                  />
                   {results.deviceInfo.ram && <DiagnosticItem label="RAM (Estimada)" value={<span>{results.deviceInfo.ram} GB</span>} />}
                  {results.deviceInfo.cpuCores && <DiagnosticItem label="Núcleos CPU" value={<span>{results.deviceInfo.cpuCores}</span>} />}
                </DiagnosticCard>
              )}
              
              {results.ipInfo && (
                <DiagnosticCard icon={<IpIcon className="w-8 h-8 text-brand-500"/>} title="Información de Red">
                  <DiagnosticItem
                      label="IP Pública"
                      value={<span className="font-mono">{results.ipInfo.ip}</span>}
                  />
                  <DiagnosticItem
                      label="Proveedor"
                      value={<span>{results.ipInfo.isp}</span>}
                  />
                  <DiagnosticItem
                      label="Ubicación"
                      value={<span>{results.ipInfo.city}, {results.ipInfo.country}</span>}
                  />
                </DiagnosticCard>
              )}

              {Object.entries(progress)
                .filter(([, p]) => p.status === 'failed')
                .map(([key, p]) => (
                  <DiagnosticCard key={key} icon={<XCircleIcon className="w-8 h-8 text-red-400"/>} title={`Fallo: ${key.replace('Info', ' Info')}`}>
                    <p className="text-red-300">{p.error}</p>
                  </DiagnosticCard>
                ))
              }
            </div>
          </section>
        )}
      </main>
       <footer className="text-center mt-auto pt-8 text-slate-500">
        <p>Herramienta de Diagnóstico v1.1</p>
      </footer>
    </div>
  );
};

export default App;
