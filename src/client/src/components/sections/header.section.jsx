import React, { Component } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';

class Cmp extends Component {
  render() {
    return (
      <AppBar position="static">
        <Toolbar>
          <IconButton aria-label="Menu"><MenuIcon /></IconButton>
          <Typography variant="h6">News</Typography>
          <Button color="inherit">Login</Button>
        </Toolbar>
      </AppBar>
    );
  }
}

export default Cmp;
