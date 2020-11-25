/**
 * Performs a query against the document
 * @param {string} selector 
 * @param {Document} [doc] optional document to query against,
 * @returns {Help}
 */
export function select(selector, doc = document) {
    // @ts-ignore
    return Help.from(doc.querySelectorAll(selector));
}

/**
 * Creates a new element
 * @param {string} element 
 * @returns {Help}
 */
export function create(element) {
    // @ts-ignore
    return Help.of(document.createElement(element));
}

/**
 * @param {Element | EventTarget} elem 
 * @returns {Help}
 */
export function from(elem) {
    // @ts-ignore
    return Help.of(elem);
}

class Help extends Array {

    /**
     * @return {Element} The first element in the collection.
     */
    get el() {
        return this[0];
    }

    /**
     * @param {string} text 
     * @returns {Help}
     */
    text(text) {
        let i = 0;
        const length = this.length;

        while (i < length) {
            this[i].textContent = text;
            i++;
        }
        
        return this;
    }

    /**
     * Recieves a key value map of attributes to apply to every element in the collection
     * @param {Object.<string, string>} attributes
     * @returns {Help}
     */
    attr(attributes) {
        for(const attr in attributes) {
            let i = 0;
            const length = this.length;
    
            while (i < length) {
                this[i].setAttribute(attr, attributes[attr]);
                i++;
            }
        }

        return this;
    }

    /**
     * Recieves a key value map of data attributes to apply to every element in the collection
     * @param {Object.<string, string>} values 
     * @returns {Help}
     */
    data(values) {
        let i = 0;
        const length = this.length;

        while (i < length) {
            Object.assign(this[i].dataset, values);

            i++;
        }

        return this;
    }

    /**
     * @param {string} id 
     * @returns {Help}
     */
    id(id) {
        let i = 0;
        const length = this.length;

        while (i < length) {
            this[i].id = id;
            i++;
        }

        return this;
    }    
    
    /**
    * @param {string} type 
    * @returns {Help}
    */
    type(type) {
        let i = 0;
        const length = this.length;

        while (i < length) {
            this[i].type = type;
            i++;
        }

        return this;
    }

    /**
     * Will append a clone to of recieved element to every element in the collection
     * @param {Element} el 
     * @returns {Help}
     */
    append(el) {
        let i = 0;
        const length = this.length;

        while (i < length) {
            this[i].appendChild(el.cloneNode(true));
            i++;
        }

        return this;
    }

    /**
     * Will perform a search against every eleent in the collection and return a new collection
     * with the combined results
     * @param {string} selector 
     * @returns {Help}
     */
    query(selector) {
        const flattened = new Help();

        let i = 0;
        const length = this.length;

        while (i < length) {
            const elements = this[i].querySelectorAll(selector);

            flattened.push(...elements);
            i++;
        }

        return flattened;
    }

    /**
     * Will perform a search against every element in the collection and return the first element to be found.
     * If no elements are found the collection will be empty
     * @param {string} selector 
     * @returns {Help}
     */
    queryFirst(selector) {
        let i = 0;
        const length = this.length;

        let element;

        while (i < length && !element) {
            element = this[i].querySelectorAll(selector)[0];
            i++;
        }
        
        // @ts-ignore
        return Help.of(element);
    }

    /**
     * Will perform a closest search against every element in the collection and return a new collection
     * with the combined results
     * @param {string} selector 
     * @returns {Help}
     */
    closest(selector) {
        const flattened = new Help();

        let i = 0;
        const length = this.length;

        while (i < length) {
            const element = this[i].closest(selector);

            flattened.push(element);
            i++;
        }

        return flattened;
    }

    /**
     * @param  {...string} classes 
     * @returns {Help}
     */
    addClass(...classes) { 
        let i = 0;
        const length = this.length;

        while (i < length) {
            this[i].classList.add(...classes);
            i++;
        }
        return this;
    }

    /**
     * @param  {...string} classes 
     * @returns {Help}
     */
    removeClass(...classes) {    
        let i = 0;
        const length = this.length;

        while (i < length) {
            this[i].classList.remove(...classes);
            i++;
        }
        
        return this;
    }    
    
    /**
    * @param  {string} cssClass 
    * @returns {Help}
    */
    toggleClass(cssClass) {    
        let i = 0;
        const length = this.length;

        while (i < length) {
            this[i].classList.toggle(cssClass);
            i++;
        }
        
        return this;
    }    
    
    /**
    * @param  {string} cssClass 
    * @returns {boolean}
    */
    hasClass(cssClass) {    
        let i = 0;
        const length = this.length;

        while (i < length) {
            if (this[i].classList.contains(cssClass))
                return true;
            else
                i++;
        }
        
        return false;
    }
    
    /**
     * Adds an event listener to every element in the collection
     * @param {string} type 
     * @param {EventListener | Function} listener 
     * @param {{ capture: boolean, once: boolean, passive: boolean }} [options]
     * @returns {Help}
     */
    on(type, listener, options) {        
        let i = 0;
        const length = this.length;

        while (i < length) {
            this[i].addEventListener(type, listener, options);
            i++;
        }

        return this;
    }

    /**
     * Get the value of the first element in the collection
     * @returns {string}
     */
    get value() {
        return this[0].value;
    }

    /**
     * Returns the collection as an Array
     * @returns {Array}
     */
    toArray() {
        return Array.from(this);
    }
}
