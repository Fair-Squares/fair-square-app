import React, { useEffect, useState } from 'react'
import { Form, Input, Grid, Card, Statistic, Table } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import { TxButton } from './substrate-lib/components'


const ContributionForm = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus } = props
  const [formValue, setFormValue] = useState(0)

  return (
    <div className='contribution-form'>
      <Form>
        <Form.Field>
          <Input
            label="New Value"
            state="newValue"
            type="number"
            onChange={(_, { value }) => setFormValue(value)}
          />
        </Form.Field>
        <Form.Field style={{ textAlign: 'center' }}>
          <TxButton
            label="Add Contribution"
            type="SIGNED-TX"
            setStatus={setStatus}
            attrs={{
              palletRpc: 'templateModule',
              callable: 'addContributionFund',
              inputParams: [formValue],
              paramFields: [true],
            }}
          />
        </Form.Field>
      </Form>
    </div>
  )
}

const parseContribution = (account, [ amount, share ]) => ({
  account: account.toJSON(),
  amount: amount.toJSON(),
  share: share.toJSON(),
})

const ContributionList = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus, contributions } = props

  console.log("[ContributionList] contributions.length : " + contributions.length);
  console.log("[ContributionList] contributions : " + contributions);

  if(contributions.length > 0) {
    return (
      // <div className="contribution-list">
      //   {contributions.map((contrib, i) => (
      //     <Contribution key={i} account={contrib.account} amount={contrib.amount} share={contrib.share} setStatus={setStatus} />
      //   ))}
      // </div>

      <div className="contribution-list">
        <Table celled striped size="small">
          <Table.Body>
            <Table.Row>
              <Table.Cell width={3} textAlign="right">
                <strong>Name</strong>
              </Table.Cell>
              <Table.Cell width={10}>
                <strong>Amount</strong>
              </Table.Cell>
                <Table.Cell width={3}>
                  <strong>Share</strong>
                </Table.Cell>
            </Table.Row>
            {contributions.map((contrib, i) => (
              <Table.Row key={contrib.account}>
                <Table.Cell width={3} textAlign="right">
                  Name
                </Table.Cell>
                <Table.Cell width={10}>
                  <span style={{ display: 'inline-block', minWidth: '31em' }}>
                    {contrib.amount}
                  </span>
                </Table.Cell>
                <Table.Cell width={3}>
                  {contrib.share}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    )
  }

  return (
    <div className="contribution-list">
  </div>
  )
}

const Contribution = props => {
  const { api, keyring, currentAccount } = useSubstrateState()
  const { account, amount, share, setStatus } = props

  console.log("[Contribution] current account address : " + api.query.system.account(currentAccount.address).nonce);
  return (
    <div className="contribution">
      <h3>
        <span className="contribution-account"></span>
        &nbsp;
        <span className="contribution-amount">{amount}</span>
        &nbsp;
        <span className="contribution-share">{share}</span>
      </h3>
    </div>
  )
}

const ContributionBox = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus } = props
  const [ currentAmount, setCurrentAmount] = useState(0)
  const [ contributions, setContributions] = useState([])
  // const [ contributions, setContributions] = useState([{account: 1, amount: 100, share: 25}, {account: 2, amount: 300, share: 75}])

  const subscribeFundAmount = () => {
    let unsub = null
    const fundAmount = () => {
      api.query.templateModule.fundAmount(newValue => {
        //console.log("[subscribeFundAmount] newValue : " + newValue);
        if(newValue.unwrap.isNone){
          setCurrentAmount('<None>')
        } else {
          setCurrentAmount(newValue.unwrap().toNumber())
        }
      })
    }
    fundAmount()
    return () => {
      unsub && unsub()
    }
  }

  const subscribeContributions = () => {
    let unsub = null
    const asyncFetch = async () => {
      const entries = await api.query.templateModule.contributions.entries();
      console.log("[subscribeContributions] entries : " + entries);
      const contributionsMap = entries.map(entry => parseContribution(entry[0], entry[1]));
      console.log("[subscribeContributions] contributionsMap : " + contributionsMap);
      setContributions(contributionsMap)
      // console.log("[subscribeContributions] Call to  api.query.templateModule.contributions");
    }
    asyncFetch()
    return () => {
      unsub && unsub()
    }
  }
  
  useEffect(subscribeFundAmount, [api, keyring])
  useEffect(subscribeContributions, [api.query.templateModule, currentAmount])

  return (
    <div className="contribution-box">
      <h2>Contributions</h2>
      <ContributionForm setStatus={setStatus} />
      <div className="contribution-total-amount">
        <Card centered>
          <Card.Content textAlign="center">
            <Statistic label="Current Amount" value={currentAmount} />
          </Card.Content>
        </Card>
      </div>
      <ContributionList contributions={contributions} setStatus={setStatus} />
    </div>
  )
}

const HouseForm = props => {

  return (
    <div className="house-form">
      
    </div>
  )
}

const HouseList = props => {

  return (
    <div className="house-list">
      
    </div>
  )
}

const House = props => {

  return (
    <div className="house">
      
    </div>
  )
}

const FsHouseList = props => {

  return (
    <div className="fs-house-list">
      
    </div>
  )
}

const FsHouse = props => {

  return (
    <div className="fs-house">
      
    </div>
  )
}

const HouseBox = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus } = props

  return (
    <div className="houseBox">
      <div>
        <HouseForm />
        <h2>Minted Houses</h2>
        <HouseList />
      </div>
      <div>
        <h2>Fair Square Houses</h2>
        <FsHouseList />
      </div>
    </div>
  )
}

const ProposalForm = props => {

  return (
    <div className="proposal-form">
      
    </div>
  )
}

const ProposalList = props => {

  return (
    <div className="proposal-list">
      
    </div>
  )
}

const Proposal = props => {

  return (
    <div className="proposal">
      
    </div>
  )
}

const ProposalBox = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus } = props

  return (
    <div className="proposal-box">
      <h2>Proposals</h2>
      <ProposalForm />
      <ProposalList />
    </div>
  )
}

function Main(props) {
  const { api, keyring } = useSubstrateState()

  // The transaction submission status
  const [status, setStatus] = useState('')

  return (

    <div className="appBox" style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-evenly",
      alignItems: "flex-start",
      paddingLeft: "100px",
      width: "50%"
  }}>
      <div className="fs-card-sim">
        <h1>Template Module</h1>
        <div style={{ overflowWrap: 'break-word' }}>{status}</div>
      </div>
      <div className="fs-card-sim">
        <ContributionBox setStatus={setStatus}></ContributionBox>
      </div>
      <div className="fs-card-sim">
        <HouseBox setStatus={setStatus}></HouseBox>
      </div>
      <div className="fs-card-sim">
        <ProposalBox setStatus={setStatus}></ProposalBox>
      </div>
    </div>
  )
}

export default function TemplateModule(props) {
  const { api } = useSubstrateState()
  return api.query.templateModule && api.query.templateModule.something ? (
    <Main {...props} />
  ) : null
}
