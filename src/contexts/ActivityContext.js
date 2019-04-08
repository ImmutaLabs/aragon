import React from 'react'
import PropTypes from 'prop-types'
import StoredList from '../StoredList'
import { network } from '../environment'

const ActivityContext = React.createContext()

const storedList = new StoredList(`activity:${network.type}`)

const activityStatusTypes = {
  CONFIRMED: 'CONFIRMED',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  TIMED_OUT: 'TIMED_OUT',
}

const activityTypes = {
  TRANSACTION: 'TRANSACTION',
}

storedList.update([
  {
    createdAt: 1554471557853,
    read: false,
    from: '0x3bDBLLATEST',
    status: activityStatusTypes.CONFIRMED,
    type: activityTypes.TRANSACTION,
    initiatingApp: 'Token Manager',
    forwarder: 'Voting',
    description: 'Mint 1 tokens for 0x3bDBLLA',
    transactionHash:
      '0x873c90026744e293f12c40a5fc6cf3b7bb368636f0dea632da50348719f96bbe',
  },
  {
    createdAt: 1554716398070,
    read: true,
    status: activityStatusTypes.PENDING,
    type: 'TRANSACTION',
    transactionHash:
      '0x90c53c7533c08a5ab3cae73df760adeb68d83b220628a2722eec7f576f679a71',
    from: '0x3bd60bafea8a7768c6f4352af4cfe01701884ff2',
    initiatingApp: 'Voting',
    forwarder: 'Voting',
    description: 'Create a new vote about "hello"',
  },
])

// Provides easy access to the user activities list
class ActivityProvider extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  state = {
    activities: storedList.loadItems(),
  }

  add = activity => {
    this.setState({
      activities: storedList.add(activity),
    })
  }

  addTransactionActivity = ({
    transactionHash = '',
    from = '',
    initiatingApp = '',
    forwarder = '',
    description = '',
  } = {}) => {
    const newActivity = {
      createdAt: Date.now(),
      type: activityTypes.TRANSACTION,
      status: activityStatusTypes.PENDING,
      read: false,
      transactionHash,
      from,
      initiatingApp,
      forwarder,
      description,
    }

    const updatedActivities = storedList.add(newActivity)

    this.setState({ activities: updatedActivities })
  }

  remove = index => {
    this.setState({
      activities: storedList.remove(index),
    })
  }

  updateActivities = activities => {
    this.setState({
      activities: storedList.update(activities),
    })
  }

  filterActivities = (predicate = activity => true) => {
    const filtered = this.state.activities.filter(predicate)

    this.setState({
      activities: storedList.update(filtered),
    })
  }

  clearActivities = () => {
    // Clear all non pending activities (we don't clear because we're awaiting state change)
    this.filterActivities(
      ({ status }) => status === activityStatusTypes.PENDING
    )
  }

  clearActivity = transactionHash => {
    this.filterActivities(
      activity => activity.transactionHash !== transactionHash
    )
  }

  markActivitiesRead = () => {
    const readActivities = this.state.activities.map(activity => ({
      ...activity,
      read: true,
    }))

    this.setState({
      activities: storedList.update(readActivities),
    })
  }

  // update activity status and set the activity to unread
  setActivityStatus = status => transactionHash => {
    const activities = this.state.activities.map(activity =>
      activity.transactionHash === transactionHash
        ? {
            ...activity,
            read: false,
            status,
          }
        : activity
    )

    this.setState({
      activities: storedList.update(activities),
    })
  }

  setActivityConfirmed = this.setActivityStatus(activityStatusTypes.CONFIRMED)
  setActivityFailed = this.setActivityStatus(activityStatusTypes.FAILED)
  setActivityTimedOut = this.setActivityStatus(activityStatusTypes.FAILED)

  getUnreadActivityCount = () =>
    this.state.activities.reduce(
      (count, { read }) => (read ? count : count + 1),
      0
    )

  render() {
    const { children } = this.props
    const { activities } = this.state
    const unreadActivityCount = this.getUnreadActivityCount()

    return (
      <ActivityContext.Provider
        value={{
          activities,
          unreadActivityCount,
          addTransactionActivity: this.addTransactionActivity,
          clearActivities: this.clearActivities,
          setActivityConfirmed: this.setActivityConfirmed,
          setActivityFailed: this.setActivityFailed,
          clearActivity: this.clearActivity,
          updateActivities: this.updateActivities,
          markActivitiesRead: this.markActivitiesRead,
        }}
      >
        {children}
      </ActivityContext.Provider>
    )
  }
}

const ActivityConsumer = ActivityContext.Consumer
export { ActivityContext, ActivityProvider, ActivityConsumer }
