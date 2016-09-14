import "fetch";
import {Storage} from "./storage";

export class Authentication {
    constructor(aurelia, router, api) {
        this.aurelia = aurelia;
        this.router = router;
        this.api = api;
    }

    logout() {
        this.api.token = undefined;
        Storage.removeItem('token');
        // @TODO: The current view(s) should be deactivated, and wizard(s) be cancelled
        return this.aurelia.setRoot('users')
            .then(() => {
                this.router.navigate('login');
            });
    };

    login(username, password) {
        return this.api.login(username, password, {ignore401: true})
            .then((data) => {
                this.api.token = data.token;
                Storage.setItem('token', data.token);
                return this.aurelia.setRoot('index')
                    .then(() => {
                        this.router.navigate('dashboard');
                    });
            });
    };

    land() {
        this.api.token = Storage.getItem('token');
        this.api.getModules()
            .then(() => {
                this.aurelia.setRoot('index')
                    .then(() => {
                        this.router.navigate('dashboard');
                    });
            })
            .catch(() => {
            });
    }
}
