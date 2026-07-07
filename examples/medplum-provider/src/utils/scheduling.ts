// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { WithId } from '@medplum/core';
import { generateId, getExtension, getIdentifier, getReferenceString, isDefined, setIdentifier } from '@medplum/core';
import type {
  Extension,
  HealthcareService,
  HealthcareServiceAvailableTime,
  Identifier,
  Resource,
  Schedule,
} from '@medplum/fhirtypes';
import { isDayOfWeek } from '../types/scheduling';

export const SchedulingParametersURI = 'https://medplum.com/fhir/StructureDefinition/SchedulingParameters';
const MedplumSchedulingTransientIdentifierURI = 'https://medplum.com/fhir/scheduling-transient-id';
export const SchedulingEncounterCodingURI = 'https://medplum.com/fhir/StructureDefinition/SchedulingEncounterCoding';
export const SchedulingPlanDefinitionURI = 'https://medplum.com/fhir/StructureDefinition/SchedulingPlanDefinition';

export const SchedulingTransientIdentifier = {
  set(resource: Resource & { identifier?: Identifier[] }) {
    setIdentifier(resource, MedplumSchedulingTransientIdentifierURI, generateId(), { use: 'temp' });
  },

  get(resource: Resource) {
    return getIdentifier(resource, MedplumSchedulingTransientIdentifierURI);
  },

  remove(resource: Resource & { identifier?: Identifier[] }) {
    resource.identifier = resource.identifier?.filter(
      (identifier) => identifier.system !== MedplumSchedulingTransientIdentifierURI
    );
  },
};

export function hasSchedulingParameters(resource: Schedule | HealthcareService): boolean {
  return !!getExtension(resource, SchedulingParametersURI);
}

export function getSchedulingParameterOverrides(
  service: WithId<HealthcareService>,
  schedule: Schedule,
  url: 'availability' | 'duration'
): Extension[] | undefined {
  const serviceRef = getReferenceString(service);
  const extension = schedule.extension
    ?.filter((extension) => extension.url === SchedulingParametersURI)
    .find((extension) => {
      const serviceExt = getExtension(extension, 'service');
      return serviceExt?.valueReference?.reference === serviceRef;
    });

  return extension?.extension?.filter((subExtension) => subExtension.url === url);
}

// Convert a single `availableTime` sub-extension into a HealthcareServiceAvailableTime.
// This mirrors the R4-encoded R5 `Availability` datatype produced by the server's
// SchedulingParameters extension (see scheduling-parameters.ts). Entries that carry
// neither `allDay` nor a complete start/end pair are dropped.
function extractAvailableTime(availableTime: Extension): HealthcareServiceAvailableTime | undefined {
  // `daysOfWeek` repeats once per day value.
  const daysOfWeek = (availableTime.extension ?? [])
    .filter((e) => e.url === 'daysOfWeek')
    .map((e) => e.valueCode)
    .filter(isDefined)
    .filter(isDayOfWeek);

  if (getExtension(availableTime, 'allDay')?.valueBoolean) {
    return { daysOfWeek, allDay: true };
  }

  const availableStartTime = getExtension(availableTime, 'availableStartTime')?.valueTime;
  const availableEndTime = getExtension(availableTime, 'availableEndTime')?.valueTime;
  if (availableStartTime && availableEndTime) {
    return { daysOfWeek, availableStartTime, availableEndTime };
  }

  return undefined;
}

export function availabilityOverrides(
  service: WithId<HealthcareService>,
  schedule: Schedule
): HealthcareServiceAvailableTime[] | undefined {
  const extensions = getSchedulingParameterOverrides(service, schedule, 'availability');
  if (!extensions?.length) {
    return undefined;
  }
  // Each `availability` extension holds one or more `availableTime` sub-extensions.
  return extensions
    .flatMap((availability) => availability.extension ?? [])
    .filter((subExtension) => subExtension.url === 'availableTime')
    .map(extractAvailableTime)
    .filter(isDefined);
}

export function extractAvailability(
  service: WithId<HealthcareService> | undefined,
  schedule: Schedule | undefined
): HealthcareServiceAvailableTime[] | undefined {
  if (!service) {
    return undefined;
  }

  if (schedule) {
    const overrides = availabilityOverrides(service, schedule);
    if (overrides !== undefined) {
      return overrides;
    }
  }

  return service.availableTime;
}
