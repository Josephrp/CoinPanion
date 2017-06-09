import React, { Component } from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { firebase } from 'react-redux-firebase'
import { Card, CardActions, CardHeader, CardTitle, CardText } from 'material-ui/Card'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import TextField from 'material-ui/TextField'

const Main = styled.div`
  display: flex;
  flexWrap: wrap;
  justify-content: space-around;
`

const Container = styled.div`
  flex-direction: column;
  max-width: 80%;
`

class UserProfile extends Component {
  state = {
    open: false,
    coinAmount: 0.0,
    imSubscribed: ''
  }

  handleOpen = () => {
    this.setState({ open: true })
  }

  handleClose = () => {
    this.setState({ open: false })
  }

  handleCoinAmountChange = (e, newValue) => {
    this.setState({ coinAmount: newValue })
  }

  validateCoining() {
    const amount = parseFloat(this.state.coinAmount)
    if (isNaN(amount) || amount < 0) {
      return false
    } else {
      return true
    }
  }

  handleCoining = () => {
    // PLACEHOLDER FOR LINKING TO CONTRACT FUNCTION
    const amount = parseFloat(this.state.coinAmount)
    if (amount <= 0 || !this.props.myAddress || !this.props.userProfile.eth_address) {
      console.error('Invalid inputs.')
      return false
    }
    if (this.state.imSubscribed) {
      // update coining
      this.props.firebase.update(`coinings/${this.state.imSubscribed}`, { eth_amount: amount })
    } else {
      // add new coining
      this.props.firebase.push('coinings', {
        coiner: this.props.myId,
        coinee: this.props.userProfile.id,
        eth_amount: amount
      })
    }
    this.setState({ open: false })
  }

  handleUnsubscribe = () => {
    if (this.state.imSubscribed) {
      this.props.firebase.remove(`coinings/${this.state.imSubscribed}`)
    }
  }

  calculateCoiners() {
    const coinings = this.props.coinings || {}
    let totalCoinedAmount = Object.values(coinings).reduce((ethSum, coining) => ethSum + coining.eth_amount, 0)
    totalCoinedAmount = Math.round(totalCoinedAmount * 10000) / 10000
    const totalCoiners = Object.keys(coinings).length
    return `Coined by ${totalCoiners} for ${totalCoinedAmount} Eth/Month`
  }

  componentWillMount() {
    const myCoiningKey = Object.keys(this.props.coinings).find(
      coiningKey => this.props.coinings[coiningKey].coiner === this.props.myId
    )
    if (myCoiningKey) {
      this.setState({ imSubscribed: myCoiningKey, coinAmount: this.props.coinings[myCoiningKey].eth_amount })
    }
  }

  render() {
    const { userProfile } = this.props
    const actions = [
      <FlatButton label="Cancel" onTouchTap={this.handleClose} />,
      <FlatButton
        label={this.state.imSubscribed ? 'Update Coining' : 'Coin!'}
        primary={true}
        keyboardFocused={true}
        onTouchTap={this.handleCoining}
      />
    ]
    if (this.state.imSubscribed) {
      actions.splice(1, 0, <FlatButton label="Unsubscribe" onTouchTap={this.handleUnsubscribe} />)
    }
    return (
      <Card>
        <CardHeader
          avatar={userProfile.photo_url}
          title={`${userProfile.first_name} ${userProfile.last_name}`}
          subtitle={userProfile.category}
        />
        <CardTitle
          title={`About ${userProfile.first_name}`}
          subtitle={userProfile.content ? `${userProfile.first_name} is creating ${userProfile.content}` : ''}
        />
        <CardText>
          {userProfile.biography}
        </CardText>
        <CardTitle title={this.calculateCoiners()} />
        <CardActions>
          <FlatButton
            label={this.state.imSubscribed ? `Update Coining` : `Coin ${userProfile.first_name}`}
            primary={true}
            onTouchTap={this.handleOpen}
          />
        </CardActions>
        <Dialog
          title={`Coin ${userProfile.first_name}`}
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
        >
          {this.state.imSubscribed
            ? `Thanks for supporting ${userProfile.first_name}!`
            : `Show your support and subscribe to ${userProfile.first_name}!`}
          <br />
          <TextField
            defaultValue={this.state.coinAmount}
            floatingLabelText="Eth per Month"
            errorText={this.validateCoining() ? null : 'Value must be a positive number'}
            onChange={this.handleCoinAmountChange}
          />
        </Dialog>
      </Card>
    )
  }
}

class Profile extends Component {
  state = {
    userExists: false,
    userProfile: {},
    coinings: {},
    myAddress: ''
  }

  componentWillReceiveProps(nextProps) {
    console.log(nextProps)
    const { addresses } = nextProps
    this.getUser(nextProps.match.params.id)
    if (addresses && addresses[0]) {
      this.setState({ myAddress: addresses[0] })
      this.props.firebase
        .database()
        .ref()
        .child('users')
        .orderByChild('eth_address')
        .equalTo(addresses[0])
        .once('value', snap => {
          if (snap.val()) {
            const myProfile = Object.values(snap.val())[0] // only 1 value should exist for an eth address
            this.setState({
              myId: myProfile.id
            })
          }
        })
    }
  }

  componentWillMount() {
    this.getUser(this.props.match.params.id)
  }

  getUser = id => {
    this.props.firebase.database().ref().child('users').orderByChild('id').equalTo(id).once('value', snap => {
      if (snap.val()) {
        const userProfile = Object.values(snap.val())[0] // only 1 value should exist for an id
        this.setState({
          userExists: true,
          userProfile: userProfile
        })
        // find associated coinings
        this.props.firebase
          .database()
          .ref()
          .child('coinings')
          .orderByChild('coinee')
          .equalTo(userProfile.id)
          .on('value', snap => {
            let coinings
            if (snap.val()) {
              coinings = snap.val()
            }
            this.setState({
              coinings: coinings
            })
          })
      }
    })
  }

  render() {
    return (
      <Main>
        {this.state.userExists
          ? <Container>
              <UserProfile
                userProfile={this.state.userProfile}
                coinings={this.state.coinings}
                firebase={this.props.firebase}
                myAddress={this.state.myAddress}
                myId={this.state.myId}
              />
            </Container>
          : <h1>User not found</h1>}
      </Main>
    )
  }
}

const fbWrappedComponent = firebase()(Profile)
export default connect()(fbWrappedComponent)
