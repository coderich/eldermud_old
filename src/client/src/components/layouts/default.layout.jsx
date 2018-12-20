import React, { Component } from 'react';
import Grid from '@material-ui/core/Grid';

class Cmp extends Component {
  render() {
    return (
      <Grid container style={{height: '100vh', background: 'silver'}}>
        <Grid item xs={3} style={{background: 'lightgrey'}}>
          {this.props.left}
        </Grid>

        <Grid container item direction="column" xs={6}>
          <Grid item>
            {this.props.header}
          </Grid>

          <Grid item style={{flexGrow: 1}}>
            {this.props.children}
          </Grid>

          <Grid item>
            {this.props.footer}
          </Grid>
        </Grid>

        <Grid item xs={3} style={{background: 'lightgrey'}}>
          {this.props.right}
        </Grid>
      </Grid>
    );
  }
}

export default Cmp;
