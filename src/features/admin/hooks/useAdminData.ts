import { useQuery } from '@tanstack/react-query';
import { adminDataService } from '../services/admin-data.service';

export const useIngestionSources = () => useQuery({ queryKey: ['admin', 'ingestion', 'sources'], queryFn: adminDataService.ingestionSources });
export const useAdminUsers = () => useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminDataService.users() });
