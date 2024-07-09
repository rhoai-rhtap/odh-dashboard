import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import React from 'react';
import { Link } from 'react-router-dom';
import { RegisteredModel } from '~/concepts/modelRegistry/types';
import { registeredModelArchiveUrl } from '~/pages/modelRegistry/screens/routeUtils';

type RegisteredModelArchiveDetailsBreadcrumbProps = {
  preferredModelRegistry?: string;
  registeredModel: RegisteredModel | null;
};

const RegisteredModelArchiveDetailsBreadcrumb: React.FC<
  RegisteredModelArchiveDetailsBreadcrumbProps
> = ({ preferredModelRegistry, registeredModel }) => (
  <Breadcrumb>
    <BreadcrumbItem
      render={() => <Link to="/modelRegistry">Registered models - {preferredModelRegistry}</Link>}
    />
    <BreadcrumbItem
      render={() => (
        <Link to={registeredModelArchiveUrl(preferredModelRegistry)}>Archived models</Link>
      )}
    />
    <BreadcrumbItem isActive>{registeredModel?.name || 'Loading...'}</BreadcrumbItem>
  </Breadcrumb>
);

export default RegisteredModelArchiveDetailsBreadcrumb;
