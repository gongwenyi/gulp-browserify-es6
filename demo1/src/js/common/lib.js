"use strict";

import $ from 'jquery';

$(function() {
    console.log('lib.js');
});

export class Person {
    static get myId() {
        return '';
    }
    constructor(name) {
        this.name = name;
    }
    describe() {
        return "Person called "+this.name;
    }
}

// Subclass
export class Employee extends Person {
    constructor(name, title) {
        super(name);
        this.title = title;
    }
    describe() {
        return super.describe() + " (" + this.title + ")";
    }
}
