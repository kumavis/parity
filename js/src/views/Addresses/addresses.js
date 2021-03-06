// Copyright 2015, 2016 Ethcore (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ContentAdd from 'material-ui/svg-icons/content/add';
import { uniq } from 'lodash';

import List from '../Accounts/List';
import Summary from '../Accounts/Summary';
import { AddAddress } from '../../modals';
import { Actionbar, ActionbarExport, ActionbarImport, ActionbarSearch, ActionbarSort, Button, Page } from '../../ui';

import styles from './addresses.css';

class Addresses extends Component {
  static contextTypes = {
    api: PropTypes.object
  }

  static propTypes = {
    balances: PropTypes.object,
    contacts: PropTypes.object,
    hasContacts: PropTypes.bool
  }

  state = {
    showAdd: false,
    sortOrder: '',
    searchValues: [],
    searchTokens: []
  }

  render () {
    const { balances, contacts, hasContacts } = this.props;
    const { searchValues, sortOrder } = this.state;

    return (
      <div className={ styles.addresses }>
        { this.renderActionbar() }
        { this.renderAddAddress() }
        <Page>
          <List
            link='address'
            search={ searchValues }
            accounts={ contacts }
            balances={ balances }
            empty={ !hasContacts }
            order={ sortOrder }
            handleAddSearchToken={ this.onAddSearchToken } />
        </Page>
      </div>
    );
  }

  renderSortButton () {
    const onChange = (sortOrder) => {
      this.setState({ sortOrder });
    };

    return (
      <ActionbarSort
        key='sortAccounts'
        id='sortAddresses'
        order={ this.state.sortOrder }
        onChange={ onChange } />
    );
  }

  renderSearchButton () {
    const onChange = (searchTokens, searchValues) => {
      this.setState({ searchTokens, searchValues });
    };

    return (
      <ActionbarSearch
        key='searchAddress'
        tokens={ this.state.searchTokens }
        onChange={ onChange } />
    );
  }

  renderActionbar () {
    const { contacts } = this.props;

    const buttons = [
      <Button
        key='newAddress'
        icon={ <ContentAdd /> }
        label='new address'
        onClick={ this.onOpenAdd } />,

      <ActionbarExport
        key='exportAddressbook'
        content={ contacts }
        filename='addressbook' />,

      <ActionbarImport
        key='importAddressbook'
        onConfirm={ this.onImport }
        renderValidation={ this.renderValidation }
      />,

      this.renderSearchButton(),
      this.renderSortButton()
    ];

    return (
      <Actionbar
        className={ styles.toolbar }
        title='Saved Addresses'
        buttons={ buttons } />
    );
  }

  renderAddAddress () {
    const { contacts } = this.props;
    const { showAdd } = this.state;

    if (!showAdd) {
      return null;
    }

    return (
      <AddAddress
        contacts={ contacts }
        onClose={ this.onCloseAdd } />
    );
  }

  renderValidation = (content) => {
    const error = {
      error: 'The provided file is invalid...'
    };

    try {
      const addresses = JSON.parse(content);

      if (!addresses || Object.keys(addresses).length === 0) {
        return error;
      }

      const body = Object
        .values(addresses)
        .filter((account) => account && account.address)
        .map((account, index) => (
          <Summary
            key={ index }
            account={ account }
            name={ account.name }
            noLink
          />
        ));

      return (
        <div>
          { body }
        </div>
      );
    } catch (e) { return error; }
  }

  onImport = (content) => {
    try {
      const addresses = JSON.parse(content);

      Object.values(addresses).forEach((account) => {
        this.onAddAccount(account);
      });
    } catch (e) {
      console.error('onImport', content, e);
    }
  }

  onAddAccount = (account) => {
    const { api } = this.context;
    const { address, name, meta } = account;

    Promise.all([
      api.parity.setAccountName(address, name),
      api.parity.setAccountMeta(address, {
        ...meta,
        timestamp: Date.now(),
        deleted: false
      })
    ]).catch((error) => {
      console.error('onAddAccount', error);
    });
  }

  onAddSearchToken = (token) => {
    const { searchTokens } = this.state;
    const newSearchTokens = uniq([].concat(searchTokens, token));
    this.setState({ searchTokens: newSearchTokens });
  }

  onOpenAdd = () => {
    this.setState({
      showAdd: true
    });
  }

  onCloseAdd = () => {
    this.setState({ showAdd: false });
  }
}

function mapStateToProps (state) {
  const { balances } = state.balances;
  const { contacts, hasContacts } = state.personal;

  return {
    balances,
    contacts,
    hasContacts
  };
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Addresses);
