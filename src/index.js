/*
 * Copyright (C) 2016 OpenMotics BVBA
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import {AdminLTE} from "admin-lte";
import {PLATFORM} from 'aurelia-pal';
import {inject, Factory} from "aurelia-framework";
import {DialogService} from "aurelia-dialog";
import {Router} from "aurelia-router";
import {Base} from "./resources/base";
import {Storage} from "./components/storage";
import {Authentication} from "./components/authentication";
import {App} from "./containers/app";
import Shared from "./components/shared";
import {Toolbox} from "./components/toolbox";
import {Unavailable} from "./pages/cloud/unavailable";

@inject(DialogService, Router, Authentication, Factory.of(App))
export class Index extends Base {
    constructor(dialogService, router, authenication, appFactory, ...rest) {
        super(...rest);
        this.appFactory = appFactory;
        this.dialogService = dialogService;
        this.router = router;
        this.authentication = authenication;
        this.apps = [];
        this.shared = Shared;
        this.locale = undefined;
        this.installations = [];
        this.currentInstallation = undefined;
        this.connectionSubscription = undefined;
        this.connectionDialog = undefined;
    };

    async setLocale(locale) {
        let oldLocale = this.i18n.getLocale();
        await this.i18n.setLocale(locale);
        this.ea.publish('i18n:locale:changed', { oldValue: oldLocale, newValue: locale });
        this.signaler.signal('aurelia-translation-signal');
        this.locale = locale;
        this.shared.locale = locale;
        Storage.setItem('locale', locale);
    }

    async setInstallation(installation) {
        this.currentInstallation = installation;
        this.api.installationId = this.currentInstallation.id;
        Storage.setItem('installation', this.currentInstallation.id);
        this.ea.publish('om:installation:change');
        return this.loadFeatures();
    }

    async loadFeatures() {
        try {
            this.shared.features = await this.api.getFeatures();
        } catch (error) {
            this.shared.features = [];
        }
    }

    // Aurelia
    async activate() {
        if (this.shared.target === 'cloud') {
            let installations = await this.api.getInstallations();
            installations.sort((a, b) => {
                return a.name === b.name ? 0 : (a.name < b.name ? -1 : 1);
            });
            this.installations = installations;
            let lastInstallationId = Storage.getItem('installation', this.installations[0].id);
            await this.setInstallation(this.installations.filter((i) => i.id === lastInstallationId)[0]);
        } else {
            await this.loadFeatures();
        }
        return this.router.configure(async (config) => {
            config.title = 'OpenMotics';
            config.addAuthorizeStep({
                run: (navigationInstruction, next) => {
                    if (navigationInstruction.config.auth) {
                        if (!this.authentication.isLoggedIn) {
                            return next.cancel(this.authentication.logout());
                        }
                    }
                    return next();
                }
            });
            config.addPostRenderStep({
                run: (navigationInstruction, next) => {
                    if (navigationInstruction.config.land) {
                        let path = navigationInstruction.fragment;
                        if (path.startsWith('/')) {
                            path = path.slice(1);
                        }
                        Storage.setItem('last', path);
                        let parent = navigationInstruction.config.settings.parent;
                        if (parent !== undefined) {
                            Storage.setItem(`last_${parent}`, path);
                        }
                    }
                    this.signaler.signal('navigate');
                    return next();
                }
            });
            config.map([
                {
                    route: '', redirect: Storage.getItem('last') || 'dashboard'
                },
                {
                    route: 'dashboard', name: 'dashboard', moduleId: PLATFORM.moduleName('pages/dashboard', 'pages'), nav: true, auth: true, land: true,
                    settings: {key: 'dashboard', title: this.i18n.tr('pages.dashboard.title')}
                },
                {
                    route: 'outputs', name: 'outputs', moduleId: PLATFORM.moduleName('pages/outputs', 'pages'), nav: true, auth: true, land: true,
                    settings: {key: 'outputs', title: this.i18n.tr('pages.outputs.title')}
                },
                {
                    route: 'thermostats', name: 'thermostats', moduleId: PLATFORM.moduleName('pages/thermostats', 'pages'), nav: true, auth: true, land: true,
                    settings: {key: 'thermostats', title: this.i18n.tr('pages.thermostats.title')}
                },
                {
                    route: 'energy', name: 'energy', nav: true, redirect: Storage.getItem('last_energy') || 'energy/realtime',
                    settings: {key: 'energy'}
                },
                {
                    route: 'energy/realtime', name: 'energy.realtime', moduleId: PLATFORM.moduleName('pages/energy/realtime', 'pages.energy'), nav: true, auth: true, land: true,
                    settings: {key: 'energy.realtime', title: this.i18n.tr('pages.energy.realtime.title'), parent: 'energy'}
                },
                ...Toolbox.iif(Shared.target === 'cloud', [
                    {
                        route: 'energy/history', name: 'energy.history', moduleId: PLATFORM.moduleName('pages/energy/history', 'pages.energy'), nav: true, auth: true, land: true,
                        settings: {key: 'energy.history', title: this.i18n.tr('pages.energy.history.title'), parent: 'energy'}
                    }
                ]),
                {
                    route: 'settings', name: 'settings', nav: true, redirect: Storage.getItem('last_settings') || 'settings/initialisation',
                    settings: {key: 'settings'}
                },
                {
                    route: 'settings/initialisation', name: 'settings.initialisation', moduleId: PLATFORM.moduleName('pages/settings/initialisation', 'pages.settings'), nav: true, auth: true, land: true,
                    settings: {key: 'settings.initialisation', title: this.i18n.tr('pages.settings.initialisation.title'), parent: 'settings'}
                },
                {
                    route: 'settings/outputs', name: 'settings.outputs', moduleId: PLATFORM.moduleName('pages/settings/outputs', 'pages.settings'), nav: true, auth: true, land: true,
                    settings: {key: 'settings.outputs', title: this.i18n.tr('pages.settings.outputs.title'), parent: 'settings'}
                },
                {
                    route: 'settings/inputs', name: 'settings.inputs', moduleId: PLATFORM.moduleName('pages/settings/inputs', 'pages.settings'), nav: true, auth: true, land: true,
                    settings: {key: 'settings.inputs', title: this.i18n.tr('pages.settings.inputs.title'), parent: 'settings'}
                },
                {
                    route: 'settings/sensors', name: 'settings.sensors', moduleId: PLATFORM.moduleName('pages/settings/sensors', 'pages.settings'), nav: true, auth: true, land: true,
                    settings: {key: 'settings.sensors', title: this.i18n.tr('pages.settings.sensors.title'), parent: 'settings'}
                },
                {
                    route: 'settings/thermostats', name: 'settings.thermostats', moduleId: PLATFORM.moduleName('pages/settings/thermostats', 'pages.settings'), nav: true, auth: true, land: true,
                    settings: {key: 'settings.thermostats', title: this.i18n.tr('pages.settings.thermostats.title'), parent: 'settings'}
                },
                {
                    route: 'settings/groupactions', name: 'settings.groupactions', moduleId: PLATFORM.moduleName('pages/settings/groupactions', 'pages.settings'), nav: true, auth: true, land: true,
                    settings: {key: 'settings.groupactions', title: this.i18n.tr('pages.settings.groupactoins.title'), parent: 'settings'}
                },
                {
                    route: 'settings/environment', name: 'settings.environment', moduleId: PLATFORM.moduleName('pages/settings/environment', 'pages.settings'), nav: true, auth: true, land: true,
                    settings: {key: 'settings.environment', title: this.i18n.tr('pages.settings.environment.title'), parent: 'settings'}
                },
                ...Toolbox.iif(Shared.target !== 'cloud', [
                    {
                        route: 'settings/cloud', name: 'settings.cloud', moduleId: PLATFORM.moduleName('pages/settings/cloud', 'pages.settings'), nav: true, auth: true, land: true,
                        settings: {key: 'settings.cloud', title: this.i18n.tr('pages.settings.cloud.title'), parent: 'settings'}
                    }
                ]),
                {
                    route: 'settings/apps', name: 'settings.apps', moduleId: PLATFORM.moduleName('pages/settings/apps', 'pages.settings'), nav: true, auth: true, land: true,
                    settings: {key: 'settings.apps', title: this.i18n.tr('pages.settings.apps.title'), parent: 'settings'}
                },
                ...Toolbox.iif(Shared.target !== 'cloud', [
                    {
                        route: 'apps/:reference', name: 'apps.index', moduleId: PLATFORM.moduleName('pages/apps/index', 'pages.apps'), nav: false, auth: true, land: true,
                        settings: {key: 'apps.index', title: ''}
                    }
                ]),
                {
                    route: 'logout', name: 'logout', moduleId: PLATFORM.moduleName('pages/logout', 'main'), nav: false, auth: false, land: false,
                    settings: {}
                }
            ]);
            config.mapUnknownRoutes({redirect: ''});

            if (Shared.target !== 'cloud') {
                let data = await this.api.getApps();
                for (let appData of data.plugins) {
                    let app = this.appFactory(appData.name);
                    app.fillData(appData);
                    if (app.hasWebUI && this.apps.find((entry) => entry.reference === app.reference) === undefined) {
                        this.apps.push({
                            name: app.name,
                            reference: app.reference
                        });
                    }
                }
            }
        });
    }

    attached() {
        window.addEventListener('aurelia-composed', () => { $('body').layout('fix'); });
        window.addEventListener('resize', () => { $('body').layout('fix'); });
        $('.dropdown-toggle').dropdown();
        this.locale = this.i18n.getLocale();
        this.shared.locale = this.locale;
        this.connectionSubscription = this.ea.subscribe('om:connection', data => {
            if (this.connectionDialog !== undefined) {
                this.connectionDialog.cancel();
                this.connectionDialog = undefined;
            }
            let connection = data.connection;
            if (!connection) {
                this.dialogService.open({viewModel: Unavailable, model: {}}).then(result => {
                    if (this.connectionDialog !== undefined) {
                        result.controller.cancel();
                    } else {
                        this.connectionDialog = result.controller;
                    }
                });
            }
        });
        this.api.connection = undefined;
    };

    detached() {
        window.removeEventListener('aurelia-composed', () => { $('body').layout('fix'); });
        window.removeEventListener('resize', () => { $('body').layout('fix'); });
        if (this.connectionSubscription !== undefined) {
            this.connectionSubscription.dispose();
        }
    };
}
