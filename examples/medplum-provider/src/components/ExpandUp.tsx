// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { BoxProps } from '@mantine/core';
import { Box, Button, Collapse, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown } from '@tabler/icons-react';
import cx from 'clsx';
import type { JSX } from 'react';
import classes from './ExpandUp.module.css';

interface ExpandUpProps extends BoxProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

export function ExpandUp(props: ExpandUpProps): JSX.Element {
  const { title, children, ...boxProps } = props;
  const [expanded, toggle] = useDisclosure(false);
  return (
    <Box {...boxProps}>
      <Group justify="space-between">
        <Button
          variant="transparent"
          onClick={toggle.toggle}
          fullWidth
          rightSection={<IconChevronDown className={cx(classes.icon, { [classes.invert]: expanded })} />}
        >
          {title}
        </Button>
      </Group>
      <Collapse in={expanded}>{children}</Collapse>
    </Box>
  );
}
