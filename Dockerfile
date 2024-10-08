# Build arguments
ARG SOURCE_CODE=.
ARG CI_CONTAINER_VERSION="unknown"

# Use ubi8/nodejs-18 as default base image
#ARG BASE_IMAGE="registry.access.redhat.com/ubi8/nodejs-18:latest"

# FROM ${BASE_IMAGE} as builder

FROM registry.access.redhat.com/ubi8/nodejs-18:latest as builder

## Build args to be used at this step
ARG SOURCE_CODE

WORKDIR /usr/src/app

## Copying in source code
COPY --chown=default:root ${SOURCE_CODE} /usr/src/app

# Change file ownership to the assemble user
USER default

RUN npm cache clean --force

RUN npm ci --omit=optional

# Set Red Hat Openshift AI logo and links
ENV ODH_LOGO=../images/rhoai-logo.svg
ENV ODH_PRODUCT_NAME="Red Hat OpenShift AI"
ENV ODH_FAVICON="rhoai-favicon.svg"
ENV DOC_LINK="https://docs.redhat.com/en/documentation/red_hat_openshift_ai/"
ENV SUPPORT_LINK="https://access.redhat.com/support/cases/#/case/new/open-case?caseCreate=true"
ENV COMMUNITY_LINK=""


RUN npm run build

# FROM ${BASE_IMAGE} as runtime

FROM registry.access.redhat.com/ubi8/nodejs-18:latest as runtime

ARG CI_CONTAINER_VERSION

WORKDIR /usr/src/app

RUN mkdir /usr/src/app/logs && chmod 775 /usr/src/app/logs

USER default

COPY --chown=default:root --from=builder /usr/src/app/frontend/public /usr/src/app/frontend/public
COPY --chown=default:root --from=builder /usr/src/app/backend/package.json /usr/src/app/backend/package.json
COPY --chown=default:root --from=builder /usr/src/app/backend/package-lock.json /usr/src/app/backend/package-lock.json
COPY --chown=default:root --from=builder /usr/src/app/backend/dist /usr/src/app/backend/dist
COPY --chown=default:root --from=builder /usr/src/app/.npmrc /usr/src/app/backend/.npmrc
COPY --chown=default:root --from=builder /usr/src/app/.env /usr/src/app/.env
COPY --chown=default:root --from=builder /usr/src/app/data /usr/src/app/data

RUN cd backend && npm cache clean --force && npm ci --omit=dev --omit=optional && chmod -R g+w ${HOME}/.npm

WORKDIR /usr/src/app/backend

CMD ["npm", "run", "start"]

LABEL com.redhat.component="odh-dashboard-container" \
      name="managed-open-data-hub/odh-dashboard-rhel8" \
      version="${CI_CONTAINER_VERSION}" \
      git.url="${CI_ODH_DASHBOARD_UPSTREAM_URL}" \
      git.commit="${CI_ODH_DASHBOARD_UPSTREAM_COMMIT}" \
      summary="odh-dashboard" \
      io.openshift.expose-services="" \
      io.k8s.display-name="odh-dashboard" \
      maintainer="['managed-open-data-hub@redhat.com']" \
      description="odh-dashboard" \
      com.redhat.license_terms="https://www.redhat.com/licenses/Red_Hat_Standard_EULA_20191108.pdf"
