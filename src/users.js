import {I18N, BaseI18N} from "aurelia-i18n";
import {AdminLTE} from "admin-lte";
import {inject} from "aurelia-framework";
import {EventAggregator} from "aurelia-event-aggregator";
import {API} from "./components/api";

@inject(API, I18N, Element, EventAggregator)
export class Users extends BaseI18N {
    constructor(api, i18n, element, ea) {
        super(i18n, element, ea);
        this.api = api;
    };

    // Aurelia
    configureRouter(config, router) {
        config.title = 'OpenMotics';
        config.map([
            {
                route: ['', 'login'], name: 'login', moduleId: 'usermanagement/login', nav: false,
                settings: {key: 'login', title: this.i18n.tr('pages.login.title')}
            },
            {
                route: 'create', name: 'create', moduleId: 'usermanagement/create', nav: false,
                settings: {key: 'create', title: this.i18n.tr('pages.create.title')}
            }
        ])
        ;
        this.router = router;
    };

    attached() {
        if ($.AdminLTE !== undefined && $.AdminLTE.layout !== undefined) {
            window.addEventListener('aurelia-composed', $.AdminLTE.layout.fix);
            window.addEventListener('resize', $.AdminLTE.layout.fix);
        }
    };

    detached() {
        if ($.AdminLTE !== undefined && $.AdminLTE.layout !== undefined) {
            window.removeEventListener('aurelia-composed', $.AdminLTE.layout.fix);
            window.removeEventListener('resize', $.AdminLTE.layout.fix);
        }
    };
}
