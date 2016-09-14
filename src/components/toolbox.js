import $ from "jquery";

export class Toolbox {
    static crossfiller(data, list, key, loader) {
        var newKeys = [], currentKeys = [], items = {};
        for (let item of data) {
            newKeys.push(item[key]);
            items[item[key]] = item;
        }
        for (let item of list) {
            if (newKeys.indexOf(item[key]) === -1) {
                list.splice(list.indexOf(item), 1);
            } else {
                currentKeys.push(item[key]);
            }
        }
        for (let newKey of newKeys) {
            if (currentKeys.indexOf(newKey) === -1) {
                currentKeys.push(newKey);
                list.push(loader(newKey));
            }
        }
        for (let item of list) {
            if (items.hasOwnProperty(item[key])) {
                item.fillData(items[item[key]]);
            }
        }
    };

    static prettifyXml(xml) {
        let serializer = new XMLSerializer();
        let xmlText = serializer.serializeToString(xml);
        let lines = xmlText.split('<');
        let indent = '';
        for (let i = 1; i < lines.length; i++) {
            let line = lines[i];
            if (line[0] == '/') {
                indent = indent.substring(2);
            }
            lines[i] = indent + '<' + line;
            if (line[0] != '/' && line.slice(-2) != '/>') {
                indent += '  ';
            }
        }
        let text = lines.join('\n');
        text = text.replace(/(<(\w+)\b[^>]*>[^\n]*)\n *<\/\2>/g, '$1</$2>');
        return text.replace(/^\n/, '');
    }

    static generateHash(length) {
        let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return (new Array(length)).join().split(',').map(function() { return chars.charAt(Math.floor(Math.random() * chars.length)); }).join('');
    }

    static ensureDefault(options, property, defaultValue) {
        if (!options.hasOwnProperty(property)) {
            options[property] = defaultValue
        }
    }

    static arrayHasElement(array, element) {
        for (let arrayElement of array) {
            if (element === arrayElement) {
                return true;
            }
        }
        return false;
    }

    static removeElement(array, element) {
        var index = array.indexOf(element);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    static getDeviceViewport() {
        let viewport = undefined;
        for (let item of ['xs', 'sm', 'md', 'lg']) {
            if ($('#device-' + item).is(':visible')) {
                viewport = item;
            }
        }
        return viewport;
    }

    static stringContains(string, value) {
        return string.indexOf(value) !== -1;
    }

    static getTimestamp() {
        return new Date().getTime();
    }
}


// Internal Javascript prototype modifications
Array.prototype.contains = function(element) {
    return Toolbox.arrayHasElement(this, element);
};
Array.prototype.remove = function(element) {
    return Toolbox.removeElement(this, element);
};
String.prototype.contains = function(value) {
    return Toolbox.stringContains(this, value);
};
