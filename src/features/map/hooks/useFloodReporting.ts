import { useCallback, useState } from 'react';
import { exportService } from '../services/export.service';
import { floodService } from '../services/flood.service';
import type { NoticeKind } from '@/hooks/useNotices';
import type { FloodPointResponseDTO } from '../types';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Coords = { lat: number; lng: number };

interface Options {
  selectedFloodPoint: FloodPointResponseDTO | undefined;
  username: string | undefined;
  notify: (kind: NoticeKind, message: string) => unknown;
}

/** Texto de erro de geolocalização, por código do navegador. */
function geolocationMessage(error: GeolocationPositionError): string {
  let msg = 'Não foi possível obter sua geolocalização. ';
  if (error.code === error.PERMISSION_DENIED) {
    msg += 'Permissão negada. Por favor, libere o acesso à localização nas configurações do seu navegador para este site.';
  } else if (error.code === error.POSITION_UNAVAILABLE) {
    msg += 'A informação de localização está indisponível.';
  } else if (error.code === error.TIMEOUT) {
    msg += 'O tempo limite expirou ao tentar buscar a localização.';
  } else {
    msg += 'Verifique as permissões de geolocalização do seu navegador.';
  }
  return msg;
}

/**
 * Fluxos de relato do mapa: registrar evento de alagamento num ponto (modal de gravidade), relatar
 * o cenário de uma coordenada (modal sim/não), exportar CSV e obter a localização do usuário.
 */
export function useFloodReporting({ selectedFloodPoint, username, notify }: Options) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSeverity, setReportSeverity] = useState<Severity>('MEDIUM');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [scenarioCoords, setScenarioCoords] = useState<Coords | null>(null);
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [isSubmittingScenario, setIsSubmittingScenario] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleExportCsv = useCallback(
    async (point: FloodPointResponseDTO) => {
      try {
        const csvData = await exportService.getUnifiedIADataCsv(point.slug);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `dataset_${point.slug}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        notify('error', 'Erro ao exportar dados para CSV.');
      }
    },
    [notify],
  );

  const handleReportFlood = useCallback(async () => {
    if (!selectedFloodPoint) return;
    setIsSubmittingReport(true);
    try {
      await floodService.reportFlood({
        floodPointSlug: selectedFloodPoint.slug,
        severity: reportSeverity,
        description: reportDescription,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(), // 1h default
        confirmedBy: username || 'Operador',
      });
      notify('success', 'Evento de alagamento registrado com sucesso.');
      setShowReportModal(false);
      setReportDescription('');
    } catch (error) {
      console.error('Erro ao reportar alagamento:', error);
      notify('error', 'Erro ao registrar evento.');
    } finally {
      setIsSubmittingReport(false);
    }
  }, [selectedFloodPoint, reportSeverity, reportDescription, username, notify]);

  const handleGetGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      notify('error', 'Geolocalização não é suportada ou disponível neste navegador (verifique se está acessando via HTTPS ou localhost).');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setScenarioCoords({ lat: latitude, lng: longitude });
        setScenarioTitle('A região onde você está se encontra alagada agora?');
        setShowScenarioModal(true);
        setIsGettingLocation(false);
      },
      (error) => {
        console.warn('Erro de geolocalização:', error.message || 'Unknown error');
        setIsGettingLocation(false);
        notify('error', geolocationMessage(error));
      },
      { enableHighAccuracy: false, timeout: 15000 },
    );
  }, [notify]);

  /** Abre o modal de cenário para uma coordenada clicada no mapa. */
  const askScenarioAt = useCallback((coords: Coords) => {
    setScenarioCoords({ lat: coords.lat, lng: coords.lng });
    setScenarioTitle('A região correspondente à coordenada clicada se encontra alagada agora?');
    setShowScenarioModal(true);
  }, []);

  const handleConfirmScenario = useCallback(
    async (isFlooded: boolean) => {
      if (!scenarioCoords) return;
      setIsSubmittingScenario(true);
      try {
        await floodService.reportScenario({
          latitude: scenarioCoords.lat,
          longitude: scenarioCoords.lng,
          isFlooded,
        });
        notify('success', 'Situação da região reportada com sucesso.');
        setShowScenarioModal(false);
        setScenarioCoords(null);
      } catch (error) {
        console.error('Erro ao reportar cenário:', error);
        notify('error', 'Erro ao enviar o relato do cenário.');
      } finally {
        setIsSubmittingScenario(false);
      }
    },
    [scenarioCoords, notify],
  );

  return {
    showReportModal,
    setShowReportModal,
    reportSeverity,
    setReportSeverity,
    reportDescription,
    setReportDescription,
    isSubmittingReport,
    showScenarioModal,
    setShowScenarioModal,
    scenarioCoords,
    scenarioTitle,
    isSubmittingScenario,
    isGettingLocation,
    handleExportCsv,
    handleReportFlood,
    handleGetGeolocation,
    askScenarioAt,
    handleConfirmScenario,
  };
}
