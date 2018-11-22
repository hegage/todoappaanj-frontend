/**
 * TodoApp
 * 
 * @class App
 */
class App {
    constructor(apiUrl, appContainer) {
        this.lists;
        this.apiUrl       = apiUrl;
        this.ui           = new UIHelpers();
        this.appContainer = (typeof appContainer !== 'undefined') ? document.getElementById(appContainer) : document.getElementById('app');
    }
    
    /**
     * Runs the app with our starting values and displays.
     *
     * This is running as an async so that we dont
     * try to access the DOM elements before our
     * fetch request is completed.
     * 
     * https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
     * 
     * @memberof App
     */
    init() {
        this.checkValidation().then(res=> {
            if (res) {
                this.clearScreen(); 
                this.renderTodoApp();
            } else {
                this.renderLogin();
            }
        })
    }

    /**
     * Sends a validation request to the api.
     * Returns a json object with a valid: true/false.
     *
     * @returns Promise
     * @memberof App
     */
    async checkValidation() {
        try {
            const res = await fetch(this.apiUrl + 'validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
            });

            const res_1 = await res.json();
            return res_1.valid;
        } catch (err) {
            return false;
        }
    }

    /**
     * @readonly
     * @memberof App
     */
    get token() {
        return localStorage.getItem('auth.token');
    }

    /**
     * @static
     * @memberof App
     */
    static set authenticatedUser(value) {
        this.authenticatedUser = value;
        localStorage.setItem('auth', value);
    }

    /**
     * Delete a single list item.
     * 
     * @param Number id
     * @memberof App
     */
    deleteItem(id) {
        fetch(this.apiUrl + 'items/' + id, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
        }).then(res => {
            this.renderTodoApp();
            // window.location.reload();
        }).catch(err => console.log(err))
    }

    /**
     * Changes the status to complete for the item.
     *
     * @param Number id
     * @memberof App
     */
    setCompleted(id) {
        fetch(this.apiUrl + 'items/' + id + '/setstatus', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
        }).then(() => {
            this.renderTodoApp();
        }).catch(err => console.log(err))
    }

    /**
     * Delete a whole list.
     *
     * @param Number id
     * @memberof App
     */
    deleteList(id) {
        fetch(this.apiUrl + 'lists/' + id, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
        }).then(res => {
            this.renderTodoApp();
        }).catch(err => console.log(err))
    }

    renderRegistration() {
        const clone = this.ui.cloneTemplate('#register')
        this.appContainer.appendChild(clone);
    }

    clearScreen() {
        this.appContainer.innerHTML = "";
    }

    logoutUser(){
        localStorage.removeItem('auth.token')
        this.clearScreen();
        this.renderLogin();
    }

    /**
     * Renders the todoapp and adds the lists with items.
     * 
     * TODO: This async thing is making items render poorly.
     * (I.e. Different and/-or random order for each reload)
     *
     * @memberof App
     */
    async renderTodoApp() {
        this.clearScreen();
        
        // Get the template
        const template = document.getElementById('todoApp').content.cloneNode(true);
        this.appContainer.appendChild(template);

        // Add logout event to the logout button.
        document.getElementById('logout').addEventListener('click', () => {
            this.logoutUser();
        })

        // Add event when adding a new list item.
        document.getElementById('addNewList').addEventListener('click', () => {
            const newListInput = document.getElementById('listName').value;
            fetch('http://localhost:4200/' + 'lists', {
                    method: 'POST',
                    body: JSON.stringify({ "name": newListInput }),
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                })
                .then(() => this.renderLists())
                .catch(error => console.log(error));
        });

        // Fetch lists and loop over all ids then fetch list items per list.
        let lists = await fetch(this.apiUrl + 'lists',{
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        lists = await lists.json();

        // Loop over lists and fetch items.
        await lists.data.forEach(item => {
            fetch(this.apiUrl + 'lists/' + item.id, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(response => {
                this.renderLists(item, response.extras)
            });
        });
    }

    /**
     * render the lists with items
     *
     * @param  Object todoList 
     * @param  Array<Object> todoItems
     * @memberof App
     */
    renderLists(todoList, todoItems) {
        var itemsList = document.getElementById('lists');
        
        // Get the template
        var list = document.getElementById('list-template').content.cloneNode(true);

        // Assign text to slot in template using classname
        list.querySelector('.list-title').innerText              = todoList.name;
        list.querySelector('.toolbar-item--delete i').dataset.id = todoList.id;
        list.querySelector('.toolbar-item--delete').addEventListener('click', (event) => {
            this.deleteList(event.target.dataset.id);
        })

        todoItems.forEach(item => {
            // Get the list item template.
            const template = document.getElementById('item-template').content.cloneNode(true);
            
            template.querySelector('.list_item-title_text').innerText   = item.title;

            // Insert meta data.
            template.querySelector('.list_item-meta_created').innerText = item.created_at;
            template.querySelector('.list_item-meta_updated').innerText = item.updated_at;

            // Handle the status of the item.
            template.querySelector('.list_item-check').innerHTML = `<i class="far fa-circle" data-id="${item.id}"></i>`;
            template.querySelector('.list_item-check').addEventListener('click', (event) => {
                this.setCompleted(event.target.dataset.id);
            });

            if(item.completed === 1 ){
                template.querySelector('.list_item').classList.add('list_item--completed')
                template.querySelector('.list_item-check').innerHTML = `<i class="far fa-check-circle" data-id="${item.id}"></i>`;
            }

            list.querySelector('.list_items').appendChild(template);
        });
        
        itemsList.appendChild(list);
    }

    renderLogin() {
        const clone = this.ui.cloneTemplate('#login')
        this.appContainer.appendChild(clone);

        let loginBt = document.querySelector("#loginBt");
        loginBt.addEventListener('click', () => {
            let username = document.getElementById("userName").value;
            let password = document.getElementById("password").value;

            const data = {
                'email': username,
                'password': password
            };

            if (username.length) {
                fetch(this.apiUrl + 'login', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                    body: JSON.stringify(data),
                }).then(data => {
                    if (data.status === 200) {
                        return data.json()
                    } else {
                        return new Error(data);
                    }
                }).then(json => {
                    localStorage.setItem('auth.token', json.token)
                    this.clearScreen();
                    this.renderTodoApp();
                }).catch(err => {
                    console.log(err);
                })
            }
        })

        // TODO: Add registration button event listener.
        let createBt = document.querySelector("#createUserBt");
    }

}   

/**
 * Helpers to deal with UI changes.
 *
 * @class UIHelpers
 */
class UIHelpers {

    /**
     * Append a HTML Element to another Element.
     *
     * @param HTMLElement parent
     * @param HTMLElement element
     */
    append(parent, element) {
        parent.appendChild(element)
    }
    /**
     * Prepend a HTML Element to another Element.
     * 
     * @param HTMLElement parent 
     * @param HTMLElement element 
     */
    prepend(parent, element) {
        parent.prepend(element)
    }


    /**
     * Create a new HTMLElement
     *
     * @param HTMLElement|string element
     * @returns
     */
    createNode(element) {
        return document.createElement(element);
    }

    /**
     * Clone and import a node.
     *
     * @param Number id
     * @returns
     * @memberof UIHelpers
     */
    cloneTemplate(id) {
        const template = document.querySelector(id);
        const clone = document.importNode(template.content, true);
        return clone
    }

}