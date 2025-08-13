# Bluesky Migration Site

A web application that supports instagram migration into bluesky. 

## Leverages Instagram to Bluesky project

Huge shoutout to the Instragram to Bluesky maintainors that allows this project to be possible.

## Project structure

```
bluesky-social-migrator/
├── .git/                          # Git repository
├── .gitignore                     # Git ignore rules
├── package.json                   # Root package configuration
├── package-lock.json             # Dependency lock file
├── node_modules/                  # Root dependencies
├── readme.md                      # This file
└── webui/                         # Angular web application
    ├── .vscode/                   # VS Code configuration
    ├── .editorconfig              # Editor configuration
    ├── .gitignore                 # WebUI git ignore rules
    ├── angular.json               # Angular CLI configuration
    ├── package.json               # WebUI package configuration
    ├── package-lock.json          # WebUI dependency lock file
    ├── tsconfig.json              # TypeScript configuration
    ├── tsconfig.app.json          # App-specific TypeScript config
    ├── tsconfig.spec.json         # Test TypeScript configuration
    ├── README.md                  # WebUI documentation
    ├── node_modules/              # WebUI dependencies
    ├── public/                    # Static assets
    │   └── favicon.ico           # Favicon
    └── src/                       # Source code
        ├── app/                   # Main application
        │   ├── app.config.ts      # App configuration
        │   ├── app.config.server.ts # Server-side config
        │   ├── app.html           # Main HTML template
        │   ├── app.routes.ts      # Client-side routing
        │   ├── app.routes.server.ts # Server-side routing
        │   ├── app.scss           # Global styles
        │   ├── app.spec.ts        # App tests
        │   └── app.ts             # Main app component
        ├── index.html             # Entry HTML file
        ├── main.ts                # Main entry point
        ├── main.server.ts         # Server entry point
        ├── server.ts              # Server configuration
        └── styles.scss            # Global styles
```

## Getting started

Init the submodule instagram to bluesky

```
git submodule --init --recursive
```

Run the web application development server

```
npm start
```

Navigate to localhost

```
http://localhost:4200
```

## Workflow

- Upload folder with archived/exported social content
- Validate information
- Add bsky credentials for migration
- Migrates with messaging