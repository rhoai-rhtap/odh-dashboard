import * as React from 'react';
import { Dropdown, DropdownList, MenuToggle, DropdownItem } from '@patternfly/react-core';
import { useNavigate } from 'react-router';
import { ArchiveModelVersionModal } from '~/pages/modelRegistry/screens/components/ArchiveModelVersionModal';
import { ModelRegistryContext } from '~/concepts/modelRegistry/context/ModelRegistryContext';
import { ModelVersion, ModelState } from '~/concepts/modelRegistry/types';
import { getPatchBodyForModelVersion } from '~/pages/modelRegistry/screens/utils';
import { ModelRegistrySelectorContext } from '~/concepts/modelRegistry/context/ModelRegistrySelectorContext';
import { modelVersionArchiveDetailsUrl } from '~/pages/modelRegistry/screens/routeUtils';

interface ModelVersionsDetailsHeaderActionsProps {
  mv: ModelVersion;
}

const ModelVersionsDetailsHeaderActions: React.FC<ModelVersionsDetailsHeaderActionsProps> = ({
  mv,
}) => {
  const { apiState } = React.useContext(ModelRegistryContext);
  const { preferredModelRegistry } = React.useContext(ModelRegistrySelectorContext);

  const navigate = useNavigate();
  const [isOpenActionDropdown, setOpenActionDropdown] = React.useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = React.useState(false);
  const tooltipRef = React.useRef<HTMLButtonElement>(null);

  return (
    <>
      <Dropdown
        isOpen={isOpenActionDropdown}
        onSelect={() => setOpenActionDropdown(false)}
        onOpenChange={(open) => setOpenActionDropdown(open)}
        popperProps={{ position: 'right' }}
        toggle={(toggleRef) => (
          <MenuToggle
            variant="primary"
            ref={toggleRef}
            onClick={() => setOpenActionDropdown(!isOpenActionDropdown)}
            isExpanded={isOpenActionDropdown}
            aria-label="Model version details action toggle"
            data-testid="model-version-details-action-button"
          >
            Actions
          </MenuToggle>
        )}
      >
        <DropdownList>
          <DropdownItem
            id="deploy-button"
            aria-label="Deploy version"
            key="deploy-button"
            onClick={() => undefined}
            ref={tooltipRef}
            isDisabled // TODO This feature is currently disabled but will be enabled in a future PR post-summit release.
          >
            Deploy
          </DropdownItem>
          <DropdownItem
            id="archive-version-button"
            aria-label="Archive version"
            key="archive-version-button"
            onClick={() => setIsArchiveModalOpen(true)}
            ref={tooltipRef}
          >
            Archive version
          </DropdownItem>
        </DropdownList>
      </Dropdown>
      <ArchiveModelVersionModal
        onCancel={() => setIsArchiveModalOpen(false)}
        onSubmit={() =>
          apiState.api
            .patchModelVersion(
              {},
              // TODO remove the getPatchBody* functions when https://issues.redhat.com/browse/RHOAIENG-6652 is resolved
              getPatchBodyForModelVersion(mv, { state: ModelState.ARCHIVED }),
              mv.id,
            )
            .then(() =>
              navigate(
                modelVersionArchiveDetailsUrl(
                  mv.id,
                  mv.registeredModelId,
                  preferredModelRegistry?.metadata.name,
                ),
              ),
            )
        }
        isOpen={isArchiveModalOpen}
        modelVersionName={mv.name}
      />
    </>
  );
};

export default ModelVersionsDetailsHeaderActions;
