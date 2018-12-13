import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Template from './components/templates/default.template';
import Index from './components/views/index.view';
import Home from './components/views/home.view';

class App extends Component {
  render() {
    return (
      <Router>
        <Template>
          <Route path="/" exact component={Index}></Route>
          <Route path="/home" component={Home}></Route>
        </Template>
      </Router>
    );
  }
}

export default App;
