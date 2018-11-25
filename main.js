
/**
 * TodoApp
 *
 * @class App
 */
class App {
    /**
     * Sends a validation request to the api.
     * Returns a json object with a valid: true/false.
     *
     * JWT Validation should be implemented in the frontend as well
     * but this works as a substitution, letting the backend
     * handle validation and responding to that.
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

            const token = await res.json();
            return token.valid;
        } catch (err) {
            return false;
        }
    }

    /**
     * Get the current token from localstorage.
     *
     * @readonly
     * @memberof App
     */
    get token() {
        return localStorage.getItem('auth.token');
    }

    /**
     * Add a new todo item.
     *
     * @param Number listId, of the list we are adding to
     * @param Object data
     * @memberof App
     */
    async addItem(listId, data) {
       const res = await fetch(this.apiUrl + 'items/' + listId, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
        await res.json();
        this.renderTodoApp();
    }

    /**
     * Delete a single list item and render the application again.
     *
     * TODO: Handle better with ajax instead of reloading.
     *
     * @param Number id
     * @memberof App
     */
    async deleteItem(id) {
        try {
            await fetch(this.apiUrl + 'items/' + id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
            });
            this.renderTodoApp();
        } catch (err) {
            return console.log(err);
        }
    }

    /**
     * Changes the status of the item.
     * If its completed marks it uncomplete.
     * If its uncomplete mark it as complete.
     *
     * FIX: There is a bug when its first triggered we need to click twice.
     *
     * TODO: Better error handling. Should provide some information to the user.
     *
     * @param Number id
     * @memberof App
     */
    async setCompleted(id) {
        try {
            await fetch(this.apiUrl + 'items/' + id + '/setstatus', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
            });
            this.renderTodoApp();
        }
        catch (err) {
            return console.log(err);
        }
    }

    /**
     * Adds a new list and render the application
     *
     * @param String title
     * @returns void
     * @memberof App
     */
    async addList(title) {
        try {
            await fetch(this.apiUrl + 'lists', {
                method: 'POST',
                body: JSON.stringify({ "name": title }),
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
            });
            return this.renderTodoApp();
        }
        catch (error) {
            return console.log(error);
        }
    }

    /**
     * Delete an entire lists, items included.
     *
     * TODO: Should provide some user warning.
     * TODO: Better error handling. Should provide some information to the user.
     *
     * @param Number id
     * @memberof App
     */
    async deleteList(id) {
        try {
            await fetch(this.apiUrl + 'lists/' + id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
            });
            this.renderTodoApp();
        } catch (err) {
            return console.log(err);
        }
    }

    /**
     * Logs out the user.
     * Clear storage, DOM and render login.
     *
     * @memberof App
     */
    logoutUser(){
        localStorage.removeItem('auth.token')
        this.clearScreen();
        this.renderLogin();
    }

    /**
     * Renders the todoapp and fetches the items from the API.
     *
     * @memberof App
     */
    async renderTodoApp() {
        this.clearScreen();

        // Get the template
        const template = this.ui.cloneTemplate('todoApp');
        this.appContainer.appendChild(template);

        // Add logout event to the logout button.
        document.getElementById('logout').addEventListener('click', () => {
            this.logoutUser();
        })

        // Create an event listener for creating a new list.
        document.getElementById('addNewList').addEventListener('click', () => {
            const title = document.getElementById('listName').value;
            this.addList(title);
        });

        // Fetch lists and loop over all ids then fetch list items per list.
        let lists = await fetch(this.apiUrl + 'lists',{
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        lists = await lists.json();

        if (lists.length > 1) {
            this.renderLists(lists);
        }
    }

    /**
     * Render the lists with items
     *
     * @param Array todoList
     * @memberof App
     */
    renderLists(todoList) {
        var itemsList = document.getElementById('lists');
        todoList.forEach(item => {

            // Get the template
            var list = document.getElementById('list-template').content.cloneNode(true);

            // Assign text to slot in template using classname
            list.querySelector('.list_title').innerText = item.title;
            list.querySelector('.toolbar-item--delete i').dataset.id = item.id;
            list.querySelector('.toolbar-item--delete').addEventListener('click', (event) => {
                this.deleteList(event.target.dataset.id);
            })

            list.querySelector('.add').dataset.id = item.id;

            list.querySelector('.add').addEventListener('click', (event) => {
                const input = event.target.previousElementSibling.firstElementChild.value;
                if (!input) { alert('You need to write a title'); return; }
                this.addItem(event.target.dataset.id, { title: input });
            })

            if (item.hasOwnProperty('items')) {
                item.items.forEach(listitem => {
                    // Get the list item template.
                    const template = document.getElementById('item-template').content.cloneNode(true);

                    template.querySelector('.list_item-title_text').innerText = listitem.title;

                    // Insert meta data.
                    template.querySelector('.list_item-meta_created').innerText = listitem.created_at;
                    template.querySelector('.list_item-meta_updated').innerText = listitem.updated_at;

                    // Handle the status of the item.
                    template.querySelector('.list_item-delete').dataset.id = listitem.id;
                    template.querySelector('.list_item-delete').addEventListener('click', (event) => {
                        this.deleteItem(event.target.dataset.id);
                    });

                    template.querySelector('.list_item-check').innerHTML = `<i class="far fa-circle" data-id="${listitem.id}"></i>`;
                    template.querySelector('.list_item-check').addEventListener('click', (event) => {
                        this.setCompleted(event.target.dataset.id);
                    });

                    if (listitem.completed === 1) {
                        template.querySelector('.list_item').classList.add('list_item--completed')
                        template.querySelector('.list_item-check').innerHTML = `<i class="far fa-check-circle" data-id="${listitem.id}"></i>`;
                    }

                    list.querySelector('.list_items').appendChild(template);
                    return;
                })
            }

            itemsList.appendChild(list);
        });
    }


    /**
     * Render login UI.
     *
     * If we get an email we render that in the input.
     *
     * @param String email
     * @memberof App
     */
    renderLogin(email) {
        this.clearScreen();

        const clone = this.ui.cloneTemplate('login')
        this.appContainer.appendChild(clone);

        if (email) { document.getElementById('userName').value = email; }

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
                        alert('No user found with the credentials provided.')
                        return new Error(data);
                    }
                }).then(json => {
                    if (json.token) {
                        localStorage.setItem('auth.token', json.token)
                        this.clearScreen();
                        this.renderTodoApp();
                    }
                }).catch(err => {
                    console.log(err);
                })
            }
        })

        let createBt = document.querySelector("#createUserBt");
        createBt.addEventListener('click', () => {
            this.renderRegistration();
        })
    }

    /**
     * Render registration UI
     *
     * @memberof App
     */
    renderRegistration() {
        this.clearScreen();
        const clone = this.ui.cloneTemplate('registration')
        this.appContainer.appendChild(clone);

        document.getElementById('create').addEventListener('click', () => {
            const username = document.getElementById('userName').value;
            const email    = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const data     = {
                username : username,
                email    : email,
                password : password
            };
            if (!data.username) { return; }

            fetch(this.apiUrl + 'users', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json()).then(res => {
                this.renderWelcome(res.data);
            })

        })
    }

    /**
     * Render welcome UI after registration complete.
     *
     * @param Object user
     * @memberof App
     */
    renderWelcome(user) {
        var user = user[0];
        this.clearScreen();

        const template = document.getElementById('welcome').content.cloneNode(true);
        template.querySelector('.username').innerText = user.username;

        this.appContainer.append(template);

        document.getElementById('login').addEventListener('click', () => {
            this.renderLogin(user.email);
        })
    }

    /**
     * Empty the dom before new rendering
     *
     * @memberof App
     */
    clearScreen() { this.appContainer.innerHTML = ""; }
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
     * Clone and import a node.
     *
     * @param Number id
     * @returns
     * @memberof UIHelpers
     */
    cloneTemplate(id) {
        return document.getElementById(id).content.cloneNode(true);
    }

}


class TodoApp extends App {
    constructor(apiUrl, appContainer) {
        super();
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
}
