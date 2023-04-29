import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import { TechRadarPage } from '@backstage/plugin-tech-radar';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';

import { AlertDisplay, OAuthRequestDialog } from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import {BackstageTheme, createTheme, darkTheme, genPageTheme, shapes} from "@backstage/theme";
import {CssBaseline, ThemeProvider} from "@material-ui/core";
import './font.css';


const customTheme: BackstageTheme = createTheme({
  palette: {
    ...darkTheme.palette,
    navigation: {
      ...darkTheme.palette.navigation,
      indicator: "#47D9CB"
    },
    status: {
      ...darkTheme.palette.status,
      error: "#FF5A5F"
    },
    primary: {
      main: "#22F4AE"
    },
    tabbar: {
      indicator: "#47D9CB"
    }
  },
  fontFamily: 'Rubik',
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({
      options: {
        fontColor: "#000000",
      },
      colors: ['#F7EA2D', '#47D9CB'],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      options: {
        fontColor: "#000000",
      },
      colors: ['#00C9EC', '#47D9CB'],
      shape: shapes.wave,
    }),
    tool: genPageTheme({
      options: {
        fontColor: "#000000",
      },
      colors: ['#FF5A5F', '#47D9CB'],
      shape: shapes.wave,
    }),
    service: genPageTheme({
      options: {
        fontColor: "#000000",
      },
      colors: ['#007286', '#47D9CB'],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      options: {
        fontColor: "#000000",
      },
      colors: ['#47D9CB', '#F7EA2D'],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      options: {
        fontColor: "#000000",
      },
      colors: ['#47D9CB', '#00C9EC'],
      shape: shapes.wave,
    }),
    other: genPageTheme({
      options: {
        fontColor: "#000000",
      },
      colors: ['#47D9CB', '#FF5A5F'],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      options: {
        fontColor: "#000000",
      },
      colors: ['#47D9CB', '#007286'],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      options: {
        fontColor: "#000000",
      },
      colors: ['#22F4AE', '#47D9CB'],
      shape: shapes.wave,
    }),
  },
});


const app = createApp({
  apis,
  themes: [{
    id: 'codecentric',
    title: 'codecentric',
    variant: 'dark',

    Provider: ({children}) => (
      <ThemeProvider theme={customTheme}>
        <CssBaseline>{children}</CssBaseline>
      </ThemeProvider>
    ),
  }],
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
});

const routes = (
  <FlatRoutes>
    <Route path="/" element={<Navigate to="catalog" />} />
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsIndexPage />} />
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/create" element={<ScaffolderPage />} />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/tech-radar"
      element={<TechRadarPage width={1500} height={800} />}
    />
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <Root>{routes}</Root>
    </AppRouter>
  </>,
);
