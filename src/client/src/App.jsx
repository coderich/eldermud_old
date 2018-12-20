import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';

import Template from './components/templates/default.template';
import Index from './components/views/index.view';
import Home from './components/views/home.view';
import reducers from './reducers';

const store = createStore(combineReducers(reducers));

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Router>
          <Template>
            <Route path="/" exact component={Index}></Route>
            <Route path="/home" component={Home}></Route>
          </Template>
        </Router>
      </Provider>
    );
  }
}

export default App;
