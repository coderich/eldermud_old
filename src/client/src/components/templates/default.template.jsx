import React, { Component } from 'react';
import Layout from '../layouts/default.layout';
import Header from '../sections/header.section';
import Footer from '../sections/footer.section';

class Cmp extends Component {
  render() {
    return (
      <Layout header={<Header/>} footer={<Footer/>}>
        {this.props.children}
      </Layout>
    );
  }
}

export default Cmp;
