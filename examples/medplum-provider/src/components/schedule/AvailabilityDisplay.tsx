// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Stack, Text, Title } from '@mantine/core';
import type { WithId } from '@medplum/core';
import { capitalize } from '@medplum/core';
import type { HealthcareService, HealthcareServiceAvailableTime, Schedule } from '@medplum/fhirtypes';
import type { JSX } from 'react';
import { availabilityOverrides } from '../../utils/scheduling';

interface AvailabilityDisplayProps {
  healthcareService: WithId<HealthcareService>;
  schedule: Schedule;
}

function EntryDisplay(props: { value: HealthcareServiceAvailableTime; overridden?: boolean }): JSX.Element {
  const { value } = props;
  const days = (value.daysOfWeek ?? []).map((day) => capitalize(day)).join(', ');
  const td = props.overridden ? 'line-through' : undefined;
  if (value.allDay) {
    return <>{days}: All day</>;
  }
  return (
    <Stack gap={0}>
      <Text td={td}>{days}:</Text>
      <Text td={td}>
        {value.availableStartTime} &ndash; {value.availableEndTime}
      </Text>
    </Stack>
  );
}

export function AvailabilityDisplay(props: AvailabilityDisplayProps): JSX.Element {
  const { healthcareService, schedule } = props;
  const serviceNoAvailability = !healthcareService.availableTime;
  const overrides = availabilityOverrides(healthcareService, schedule);
  return (
    <>
      <Title order={6}>Schedule Overrides</Title>
      {!overrides?.length ? (
        <Text size="sm" c="dimmed">
          No overrides; inherit from Service
        </Text>
      ) : (
        <ul>
          {overrides?.map((value) => (
            <li>
              <EntryDisplay value={value} />
            </li>
          ))}
        </ul>
      )}

      <Title order={6}>Service Type Availability</Title>
      {serviceNoAvailability ? (
        <Text size="sm" c="dimmed">
          No availability; default to 24/7
        </Text>
      ) : (
        <ul>
          {healthcareService.availableTime?.map((value) => (
            <li>
              <EntryDisplay value={value} overridden={!!overrides?.length} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
