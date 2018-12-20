import React, { Component } from 'react';
import { Card, CardActions, CardContent, Input, InputAdornment } from '@material-ui/core';

class Cmp extends Component {
  state = {
    cmd: '',
    history: [],
  }

  handleChange = prop => event => {
    this.setState({ [prop]: event.target.value });
  };

  handleKeyPress = prop => event => {
    const cmd = this.state.cmd.trim();

    if (event.key.toLowerCase() === 'enter' && cmd.length) {
      this.setState((state, props) => {
        return {
          cmd: '',
          history: state.history.concat(cmd),
        };
      });
    }
  };

  render() {
    return (
      <Card>
        <CardContent>
          <ul>
            {this.state.history.map((txt, index) => <li key={index}>{txt}</li>)}
          </ul>
        </CardContent>
        <CardActions>
          <Input
            autoFocus={true}
            spellCheck={false}
            fullWidth={true}
            disableUnderline={true}
            value={this.state.cmd}
            onChange={this.handleChange('cmd')}
            onKeyPress={this.handleKeyPress()}
            startAdornment={<InputAdornment position="start">></InputAdornment>}
          />
        </CardActions>
      </Card>
    );
  }
}

export default Cmp;
