# Build arguments
ARG SOURCE_CODE=.

# First stage: builder
FROM registry.access.redhat.com/ubi8/nodejs-18:latest AS builder

# Build args to be used at this step
ARG SOURCE_CODE

WORKDIR /usr/src/app

# Copying in source code
COPY --chown=default:root ${SOURCE_CODE} /usr/src/app

# Change file ownership to the assemble user
USER default

RUN npm cache clean --force
RUN npm ci --omit=optional

RUN npm run build

# Second stage: runtime
FROM registry.access.redhat.com/ubi8/nodejs-18:latest AS runtime

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
# COPY --chown=default:root --from=builder /usr/src/app/frontend/sltoken.txt /usr/src/app/frontend/sltoken.txt

WORKDIR /usr/src/app/frontend

ENV CYPRESS_INSTALL_BINARY=0

RUN npm install --loglevel=error slnodejs@6.1.724

RUN npx slnodejs config --tokenfile ./sltoken.txt --appname "odh-dashboard-frontend" --branch "poc-local" --build $(date +"%y%m%d_%H%M")
RUN npx slnodejs scan --tokenfile ./sltoken.txt --buildsessionidfile buildSessionId --instrumentForBrowsers --workspacepath ./public --outputpath /usr/src/app/frontend/sl_public --scm none
RUN rm -rf ./public
RUN ls

RUN mkdir /usr/src/app/frontend/public
RUN mv /usr/src/app/frontend/sl_public/* /usr/src/app/frontend/public/

# WORKDIR /usr/src/app

# RUN cd backend && npm cache clean --force && npm ci --omit=dev --omit=optional && chmod -R g+w ${HOME}/.npm

WORKDIR /usr/src/app/backend

ENV CYPRESS_INSTALL_BINARY=0

# Copy package files
COPY backend/package*.json ./

# Clean npm cache
RUN npm cache clean --force

# Install dependencies with detailed logging
RUN npm ci --omit=dev --omit=optional

# Set permissions for the .npm directory
RUN chmod -R g+w ${HOME}/.npm

# Continue with other steps, such as copying application code
WORKDIR /usr/src/app
COPY . .


WORKDIR /usr/src/app/backend

CMD ["npm", "run", "start"]

LABEL io.opendatahub.component="odh-dashboard" \
      io.k8s.display-name="odh-dashboard" \
      name="open-data-hub/odh-dashboard-ubi8" \
      summary="odh-dashboard" \
      description="Open Data Hub Dashboard"
