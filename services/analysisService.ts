import { SpeedTestData, LocationData, DeviceInfo, Rating } from '../types';

export const rateSpeed = (data: SpeedTestData): Rating => {
    let score = 0;
    
    // Download speed score (weight: 40%)
    if (data.downloadSpeed > 50) score += 40;
    else if (data.downloadSpeed > 20) score += 30;
    else if (data.downloadSpeed > 10) score += 20;
    else score += 5;

    // Upload speed score (weight: 30%)
    if (data.uploadSpeed > 10) score += 30;
    else if (data.uploadSpeed > 5) score += 20;
    else if (data.uploadSpeed > 2) score += 10;
    else score += 5;

    // Latency score (weight: 30%)
    if (data.latency < 30) score += 30;
    else if (data.latency < 100) score += 20;
    else if (data.latency < 200) score += 10;
    else score += 5;

    if (score >= 90) return {
        level: 'excellent',
        label: 'Excelente',
        description: 'Tu velocidad es de primer nivel. Ideal para streaming 4K, juegos en línea y videollamadas sin interrupciones.'
    };
    if (score >= 70) return {
        level: 'good',
        label: 'Buena',
        description: 'Conexión sólida y confiable para la mayoría de las tareas diarias, incluyendo trabajo remoto y streaming en HD.'
    };
    if (score >= 40) return {
        level: 'average',
        label: 'Promedio',
        description: 'Suficiente para navegar y realizar tareas básicas. Podrías experimentar lentitud con múltiples dispositivos.'
    };
    return {
        level: 'poor',
        label: 'Deficiente',
        description: 'Tu conexión es lenta. Puede ser difícil realizar videollamadas o consumir contenido en alta definición.'
    };
};

export const rateLocation = (data: LocationData): Rating => {
    const accuracy = data.accuracy;
    if (accuracy <= 20) return {
        level: 'excellent',
        label: 'Excelente Precisión',
        description: 'Tu ubicación se detecta con alta precisión, ideal para logística y navegación exacta.'
    };
    if (accuracy <= 50) return {
        level: 'good',
        label: 'Buena Precisión',
        description: 'La precisión es confiable para la mayoría de los casos de uso de geolocalización.'
    };
    if (accuracy <= 100) return {
        level: 'average',
        label: 'Precisión Regular',
        description: 'La ubicación puede tener un margen de error. Aceptable, pero no ideal para tareas de alta precisión.'
    };
    return {
        level: 'poor',
        label: 'Precisión Baja',
        description: 'La señal de GPS es débil o imprecisa, lo que podría afectar la exactitud del seguimiento.'
    };
}

export const rateDevice = (data: DeviceInfo): Rating => {
    if (data.os === 'Windows' || data.isHuawei) {
        return {
            level: 'fail',
            label: 'Dispositivo no Compatible',
            description: `Este dispositivo (${data.os}${data.isHuawei ? '/Huawei' : ''}) no es compatible. La aplicación está diseñada para dispositivos móviles Android (no Huawei) y iOS.`
        };
    }

    if (data.os === 'Android' && data.osVersion && data.osVersion < 10) {
        return {
            level: 'poor',
            label: 'Sistema Operativo Antiguo',
            description: `Tu versión de Android (${data.osVersion}) está desactualizada. Se recomienda Android 10 o superior para un rendimiento y seguridad óptimos.`
        };
    }

    if (data.os === 'iOS' && data.osVersion && data.osVersion < 15) {
        return {
            level: 'poor',
            label: 'Sistema Operativo Antiguo',
            description: `Tu versión de iOS (${data.osVersion}) está desactualizada. Se recomienda iOS 15 o superior para un rendimiento y seguridad óptimos.`
        };
    }
    
    let score = 0;
    if (data.ram) {
        if (data.ram >= 8) score += 2;
        else if (data.ram >= 4) score += 1;
    }
    if (data.cpuCores) {
        if (data.cpuCores >= 8) score += 2;
        else if (data.cpuCores >= 4) score += 1;
    }

    if(score >= 3) return {
        level: 'excellent',
        label: 'Dispositivo de Gama Alta',
        description: 'Tu dispositivo tiene excelentes especificaciones para ejecutar aplicaciones demandantes sin problemas.'
    };
    if(score >= 2) return {
        level: 'good',
        label: 'Dispositivo Competente',
        description: 'Tu dispositivo es moderno y capaz de manejar la mayoría de las tareas de forma fluida.'
    };
    return {
        level: 'average',
        label: 'Dispositivo Básico',
        description: 'Las especificaciones son modestas. El rendimiento puede ser limitado en tareas complejas.'
    };
}