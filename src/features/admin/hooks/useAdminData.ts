import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminDataService, type RunFilter } from '../services/admin-data.service';
import type { UserPatch } from '../schemas/admin.schema';
import type { Role } from '@/lib/apiSchemas';

export const useIngestionSources = () => useQuery({ queryKey: ['admin', 'ingestion', 'sources'], queryFn: adminDataService.ingestionSources, refetchInterval: 60_000 });
export const useIngestionRuns = (f: RunFilter) =>
  useQuery({ queryKey: ['admin', 'ingestion', 'runs', f], queryFn: () => adminDataService.ingestionRuns(f), placeholderData: keepPreviousData });
export const useIntegrityCheck = () => useMutation({ mutationFn: adminDataService.checkIntegrity });

export const useAdminUsers = (page = 0, size = 20) =>
  useQuery({ queryKey: ['admin', 'users', page, size], queryFn: () => adminDataService.users(page, size), placeholderData: keepPreviousData });

export function usePatchUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: UserPatch }) => adminDataService.patchUser(id, patch),
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export const useCreateInvite = () =>
  useMutation({ mutationFn: ({ role, email }: { role: Role; email?: string | null }) => adminDataService.createInvite(role, email) });
