import React from 'react';
import {
  Bullseye,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Modal,
  Spinner,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { ModelRegistryKind } from '~/k8sTypes';
import useFetchState, { NotReadyError } from '~/utilities/useFetchState';
import { getModelRegistryBackend } from '~/services/modelRegistrySettingsService';
import ModelRegistryDatabasePassword from './ModelRegistryDatabasePassword';

type ViewDatabaseConfigModalProps = {
  modelRegistry: ModelRegistryKind;
  isOpen: boolean;
  onClose: () => void;
};

const ViewDatabaseConfigModal: React.FC<ViewDatabaseConfigModalProps> = ({
  modelRegistry: mr,
  isOpen,
  onClose,
}) => {
  const dbSpec = mr.spec.mysql || mr.spec.postgres;
  const host = dbSpec?.host || 'Unknown';
  const port = dbSpec?.port || 'Unknown';
  const username = dbSpec?.username || 'Unknown';
  const database = dbSpec?.database || 'Unknown';

  const [password, passwordLoaded, passwordLoadError] = useFetchState(
    React.useCallback(async () => {
      if (!isOpen) {
        throw new NotReadyError('Defer load until modal opened');
      }
      const { databasePassword } = await getModelRegistryBackend(mr.metadata.name);
      return databasePassword;
    }, [mr, isOpen]),
    undefined,
  );

  return (
    <Modal
      title="View database configuration"
      description="This external database is where model data is stored."
      isOpen={isOpen}
      onClose={onClose}
      variant="medium"
      actions={[
        <Button key="close" variant="link" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {!passwordLoaded && !passwordLoadError ? (
        <Bullseye className={spacing.my_2xl}>
          <Spinner size="xl" />
        </Bullseye>
      ) : (
        <DescriptionList orientation={{ md: 'horizontal' }} className={spacing.myMd}>
          <DescriptionListGroup>
            <DescriptionListTerm>Host</DescriptionListTerm>
            <DescriptionListDescription data-testid="mr-db-host">{host}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Port</DescriptionListTerm>
            <DescriptionListDescription data-testid="mr-db-port">{port}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Username</DescriptionListTerm>
            <DescriptionListDescription data-testid="mr-db-username">
              {username}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Password</DescriptionListTerm>
            <DescriptionListDescription data-testid="mr-db-password">
              <ModelRegistryDatabasePassword password={password} loadError={passwordLoadError} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Database</DescriptionListTerm>
            <DescriptionListDescription data-testid="mr-db-database">
              {database}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      )}
    </Modal>
  );
};

export default ViewDatabaseConfigModal;
