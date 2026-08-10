import { MetadataResponseDTO } from '@data-contracts/backend/data-contracts';

export const mockMetadata: MetadataResponseDTO = {
    categories: [
        {
            name: "KATEGORI",
            displayName: "test",
            types: [
                {
                    name: "TYPETEST",
                    displayName: "typtest",
                    escalationEmail: "",
                    created: "2025-12-08T11:49:39.992+01:00"
                }
            ],
            created: "2025-12-08T11:49:20.599+01:00"
        }
    ],
    labels: {
        labelStructure: [
            {
                id: "33d3d9e7-1ae2-4f58-a2cc-49c9a903fe12",
                classification: "CATEGORY",
                displayName: "Test",
                resourcePath: "TEST",
                resourceName: "TEST",
                labels: [
                    {
                        id: "3d5f41c0-106c-4ab3-8e61-c0ce7856cc72",
                        classification: "TYPE",
                        displayName: "Test2",
                        resourcePath: "TEST/TEST2",
                        resourceName: "TEST2",
                        labels: []
                    }
                ]
            }
        ]
    },
    statuses: [
        {
            name: "DRAFT",
            created: "2025-12-08T14:35:21.97+01:00"
        },
        {
            name: "NEW",
            created: "2025-12-08T14:06:19.288+01:00"
        }
    ],
    roles: [
        {
            name: "REPORTER",
            displayName: "Rapportör",
            created: "2025-12-09T09:23:09.485+01:00"
        },
                {
            name: "PRIMARY",
            displayName: "Ärendeägare",
            created: "2025-12-09T09:23:09.485+01:00"
        },
                {
            name: "CONTACT",
            displayName: "Kontaktperson",
            created: "2025-12-09T09:23:09.485+01:00"
        }
    ]
};
