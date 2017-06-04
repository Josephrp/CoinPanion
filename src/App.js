import React, { Component } from 'react'
import SimpleStorageContract from '../build/contracts/SimpleStorage.json'
import Config from '../truffle.js'
import Web3 from 'web3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

import Explore from './scenes/Explore'

import * as firebase from 'firebase'

const config = {
  apiKey: 'AIzaSyBvtALc2KP_uV8xshxM-Lh2bhww6ywjPOU',
  authDomain: 'coinpanion.firebaseapp.com',
  databaseURL: 'https://coinpanion.firebaseio.com',
  projectId: 'coinpanion',
  storageBucket: 'coinpanion.appspot.com',
  messagingSenderId: '864785142515'
}
firebase.initializeApp(config)

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      storageValue: 0
    }
  }

  componentWillMount() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    // So we can update state later.
    var self = this

    // Get the RPC provider and setup our SimpleStorage contract.
    var { host, port } = Config.networks[process.env.NODE_ENV]

    const provider = new Web3.providers.HttpProvider('http://' + host + ':' + port)
    const contract = require('truffle-contract')
    const simpleStorage = contract(SimpleStorageContract)
    simpleStorage.setProvider(provider)

    // Get Web3 so we can get our accounts.
    const web3RPC = new Web3(provider)

    // Declaring this for later so we can chain functions on SimpleStorage.
    var simpleStorageInstance

    // Get accounts.
    web3RPC.eth.getAccounts(function(error, accounts) {
      console.log(accounts)

      simpleStorage
        .deployed()
        .then(function(instance) {
          simpleStorageInstance = instance

          // Stores a value of 5.
          return simpleStorageInstance.set(5, { from: accounts[0] })
        })
        .then(function(result) {
          // Get the value from the contract to prove it worked.
          return simpleStorageInstance.get.call(accounts[0])
        })
        .then(function(result) {
          // Update state with the result.
          return self.setState({ storageValue: result.c[0] })
        })
    })
  }

  render() {
    return (
      <div className="App">
        <Explore />

        {/*<main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Good to Go!</h1>
              <p>Your Truffle Box is installed and ready.</p>
              <h2>Smart Contract Example</h2>
              <p>
                The below will show a stored value of 5 by default if your contracts compiled and migrated successfully.
              </p>
              <p>
                Try changing the value stored on
                {' '}
                <strong>line 50</strong>
                {' '}
                of App.js.
              </p>
              <p>The stored value is: {this.state.storageValue}</p>
            </div>
          </div>
        </main>*/}
      </div>
    )
  }
}

export default App
