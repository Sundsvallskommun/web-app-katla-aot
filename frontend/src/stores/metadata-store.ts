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

// Storen är medvetet inte persistad. En localStorage-kopia gjorde att ärendesidor
// kunde rendera på en platsstruktur som hämtades för länge sedan, och platsvalet
// styr vilka som får se ärendet. Varje yta hämtar i stället metadata via
// useLoadMetadata.
export const useMetadataStore = create<MetadataState>()((set) => ({
  metadata: null,

  setMetadata: (metadata) => {
    set({ metadata });
  },

  setCategories: (categories) => {
    set((state) => ({
      metadata: { ...(state.metadata ?? {}), categories },
    }));
  },

  setExternalIdTypes: (externalIdTypes) => {
    set((state) => ({
      metadata: { ...(state.metadata ?? {}), externalIdTypes },
    }));
  },

  setLabels: (labels) => {
    set((state) => ({
      metadata: { ...(state.metadata ?? {}), labels },
    }));
  },

  setStatuses: (statuses) => {
    set((state) => ({
      metadata: { ...(state.metadata ?? {}), statuses },
    }));
  },

  setRoles: (roles) => {
    set((state) => ({
      metadata: { ...(state.metadata ?? {}), roles },
    }));
  },

  setContactReasons: (contactReasons) => {
    set((state) => ({
      metadata: { ...(state.metadata ?? {}), contactReasons },
    }));
  },
}));
