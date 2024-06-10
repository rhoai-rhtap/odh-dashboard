[Dev setup & Requirements]: docs/dev-setup.md
[Dashboard documentation]: docs/README.md

# Open Data Hub Dashboard

A dashboard for Open Data Hub components, featuring user flows to navigate and interact with the various component parts of the stack.

## Contributing

Contributing encompasses [repository specific requirements](./CONTRIBUTING.md).

## Documentation

Read more about the Dashboard in one of our documentation links.

- [Dev setup & Requirements]
- [Dashboard documentation]

Configure Sea-light image of frontend codebase

1. Go to frontend folder `cd frontend`
2. Create a sltoken.txt file and add sea-light token in it
3. Go back to parent directory `cd ../`
4. Create `.env.local` file and add your quay repository url `IMAGE_REPOSITORY=quay-url`
5. Run `make build`
6. RUN `make push`
