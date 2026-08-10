import {
  CategoryDTO,
  ContactReasonDTO,
  ExternalIdTypeDTO,
  LabelsDTO,
  MetadataResponseDTO,
  RoleDTO,
  StatusDTO,
} from '@data-contracts/backend/data-contracts';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface MetadataState {
  metadata: MetadataResponseDTO | null;
  setMetadata: (metadata: MetadataResponseDTO) => void;

  setCategories: (categories: CategoryDTO[]) => void;
  setExternalIdTypes: (types: ExternalIdTypeDTO[]) => void;
  setLabels: (labels: LabelsDTO) => void;
  setStatuses: (statuses: StatusDTO[]) => void;
  setRoles: (roles: RoleDTO[]) => void;
  setContactReasons: (reasons: ContactReasonDTO[]) => void;
}

export const useMetadataStore = create<MetadataState>()(
  persist(
    (set) => ({
      metadata: null,

      setMetadata: (metadata) => set({ metadata }),

      setCategories: (categories) =>
        set((state) => ({
          metadata: { ...(state.metadata ?? {}), categories },
        })),

      setExternalIdTypes: (externalIdTypes) =>
        set((state) => ({
          metadata: { ...(state.metadata ?? {}), externalIdTypes },
        })),

      setLabels: (labels) =>
        set((state) => ({
          metadata: { ...(state.metadata ?? {}), labels },
        })),

      setStatuses: (statuses) =>
        set((state) => ({
          metadata: { ...(state.metadata ?? {}), statuses },
        })),

      setRoles: (roles) =>
        set((state) => ({
          metadata: { ...(state.metadata ?? {}), roles },
        })),

      setContactReasons: (contactReasons) =>
        set((state) => ({
          metadata: { ...(state.metadata ?? {}), contactReasons },
        })),
    }),

    {
      name: 'metadata-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
