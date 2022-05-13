import React, { useEffect, useState } from 'react'
import { Form, Input, Grid, Card, Statistic, Table, Button, Modal, Message } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import { TxButton } from './substrate-lib/components'


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
      width: "100%"
  }}>
      <div className="fs-card-sim">
        <h1>Fair Squares Module</h1>
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

const parseContribution = (amount, share, account_id) => ({
  account: account_id,
  amount: amount,
  share: share,
})

const ContributionBox = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus } = props
  const [ currentAmount, setCurrentAmount] = useState(0)
  const [ contributions, setContributions] = useState([])

  const subscribeFundAmount = () => {

    let unsub = null
    const fundAmount = () => {
      api.query.templateModule.fundAmount(newValue => {

        try {
          setCurrentAmount(newValue.unwrap().toNumber())
        } catch (error) {
          
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
      const contributionsMap = entries.map(entry => { 
        let jsonEntry = entry[1].toJSON();
        console.log("[ContributionBox] contribution account = " + keyring.getPair(jsonEntry[2]).meta.name);
        return parseContribution(jsonEntry[0], jsonEntry[1], keyring.getPair(jsonEntry[2]).meta.name);
      });
      setContributions(contributionsMap)
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

const ContributionForm = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus } = props
  const [formValue, setFormValue] = useState(0)

  return (
    <div className='contribution-form'>
      <Form style={{display: 'flex', flexDirection: 'row'}}>
        <Form.Field style={{ marginRight: '10px' }}>
          <Input
            label="Amount"
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

const ContributionList = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus, contributions } = props
  
  if(contributions.length > 0) {
    return (
      
      <div className="contribution-list" style={{marginTop: '10px'}}>
        <Table celled striped size="small">
          <Table.Body>
            <Table.Row>
              <Table.Cell width={3} textAlign="right">
                <strong>Account</strong>
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
                {contrib.account}
                </Table.Cell>
                <Table.Cell width={10}>
                  <span style={{ display: 'inline-block', minWidth: '31em' }}>
                    {contrib.amount}
                  </span>
                </Table.Cell>
                <Table.Cell width={3}>
                  {/* {Math.round(contrib.share + Number.EPSILON) / 1000} % */}
                  {(contrib.share / 1000).toFixed(2)} %
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

const HouseBox = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus } = props
  const [ currentHouseIndex, setCurrentHouseIndex] = useState(0)
  const [ houses, setHouses] = useState([])
  const [ fshouses, setFsHouses] = useState([])
  const [ ownerships, setOwnerships] = useState([])
  const [ fsOwnerships, setFsOwnerships] = useState([])

  const subscribeHouseIndex = () => {
    let unsub = null
    const houseIndex = () => {
      api.query.templateModule.houseIndex(newValue => {
        setCurrentHouseIndex(newValue.toNumber())
      })
    }
    houseIndex()
    return () => {
      unsub && unsub()
    }
  }

  const subscribeMintedHouses = () => {
    let unsub = null
    const asyncFetch = async () => {

      let houses = await api.query.templateModule.mintedHouses.entries();
      const housesMap = houses.map(house => {

        let jsonHouse = house[1].toJSON();
        if(jsonHouse !== null) {
          api.query.templateModule.ownerships.multi(
            jsonHouse.ownerships,
            ownerships => {
              const ownersMap = ownerships.map(ownership => {

                let jsonOwner = ownership.toJSON();
                return {
                  account_id: keyring.getPair(jsonOwner.accountId).meta.name,
                  share: (jsonOwner.share / 1000).toFixed(2)
                }
              });

              setOwnerships(ownersMap);
            }
          );

          return {
            id: jsonHouse.id,
            name: jsonHouse.name,
            ownerships: ownerships
          }
        }
      });
      setHouses(housesMap);
    }
    asyncFetch()
    return () => {
      unsub && unsub()
    }
  }

  const subscribeFsHouses = () => {
    let unsub = null
    const asyncFetch = async () => {

      let houses = await api.query.templateModule.fsHouses.entries();
      const housesMap = houses.map(house => {

        let jsonHouse = house[1].toJSON();
        if(jsonHouse !== null) {
          api.query.templateModule.ownerships.multi(
            jsonHouse.ownerships,
            ownerships => {
              const ownersMap = ownerships.map(ownership => {

                let jsonOwner = ownership.toJSON();
                return {
                  account_id: keyring.getPair(jsonOwner.accountId).meta.name,
                  share: (jsonOwner.share / 1000).toFixed(2)
                }
              });

              setFsOwnerships(ownersMap);
            }
          );

          return {
            id: jsonHouse.id,
            name: jsonHouse.name,
            ownerships: fsOwnerships
          }
        }
      });
      setFsHouses(housesMap);
    }
    asyncFetch()
    return () => {
      unsub && unsub()
    }
  }

  useEffect(subscribeHouseIndex, [api, keyring])
  useEffect(subscribeMintedHouses, [api.query.templateModule, currentHouseIndex, houses])
  useEffect(subscribeFsHouses, [api.query.templateModule, currentHouseIndex, fshouses])

  return (
    <div className="houseBox" 
      style={{
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        width: '100%',
        marginTop: '50px'}}>
      <div>
        <HouseForm setStatus={setStatus} />
        <h2>Minted Houses</h2>
        <HouseList houses={houses} setStatus={setStatus} />
      </div>
      <div style={{paddingTop: '75px'}}>
        <div style={{borderLeft: '1px solid gray', paddingLeft: '20px'}}>
          <h2>Fair Square Houses</h2>
          <FsHouseList houses={fshouses} setStatus={setStatus} />
        </div>
      </div>
    </div>
  )
}

const HouseForm = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus } = props
  const [formValue, setFormValue] = useState(0)

  return (
    <div className="house-form">
      <Form style={{display: 'flex', flexDirection: 'row'}}>
        <Form.Field style={{ marginRight: '10px' }}>
          <Input
            label="House's name"
            state="newValue"
            type="text"
            onChange={(_, { value }) => setFormValue(value)}
          />
        </Form.Field>
        <Form.Field style={{ textAlign: 'center' }}>
          <TxButton
            label="Mint House"
            type="SIGNED-TX"
            setStatus={setStatus}
            attrs={{
              palletRpc: 'templateModule',
              callable: 'mintHouse',
              inputParams: [formValue],
              paramFields: [true],
            }}
          />
        </Form.Field>
      </Form>
    </div>
  )
}

const HouseList = props => {
  const { setStatus, houses } = props

  if(houses.length > 0 && houses[0] !== undefined){
    return (
      <div className="house-list">
        {houses.map((house, i) => (
          <House key={i} id={house.id} name={house.name} setStatus={setStatus} ownerships={house.ownerships}/>
        ))}
      </div>
    )
  }else {
    return (
      <div className="house-list">
        
      </div>
    )
  }
  
}

const House = props => {
  const { setStatus, id, name, ownerships } = props

  return (
    <div className="house" 
      style={{
        border: "1px solid gray", 
        margin: "5px",
        padding: "5px"
    }}>
      <div className="fs-house-header">
        <h2 className="house-name">{name}</h2>
        <span className="house-id">{id}</span>
      </div>
      <div className="fs-house-ownerships">
        {ownerships.map((ownership, i) => (
          <div className="fs-house-ownership" key={i}>
            <div className="fs-house-ownership-account">{ownership.account_id}</div>
            <div className="fs-house-ownership-share">{ownership.share} %</div>
          </div>
        ))}
      </div>
      <div>
        <ProposalForm setStatus={setStatus} houseId={id}/>
      </div>
    </div>
  )
}

const FsHouseList = props => {
  const { setStatus, houses } = props

  if(houses.length > 0){
    return (
      <div className="fs-house-list">
        {houses.map((house, i) => (
          <FsHouse key={i} id={house.id} name={house.name} ownerships={house.ownerships}/>
        ))}
      </div>
    )
  }else {
    return (
      <div className="fs-house-list">
      </div>
    )
  }
}

const FsHouse = props => {
  const { id, name, ownerships } = props

  return (
    <div className="fs-house" 
      style={{
        border: "1px solid gray", 
        margin: "5px",
        padding: "5px"
    }}>
      <div className="fs-house-header">
        <h2 className="house-name">{name}</h2>
        <span className="house-id">{id}</span>
      </div>
      <div className="fs-house-ownerships">
        {ownerships.map((ownership, i) => (
          <div className="fs-house-ownership" key={i} 
            style={{ 
              border: '1px solid #efeff0',
              padding: '5px',
              marginTop: '5px'
            }}>
            <div className="fs-house-ownership-account">{ownership.account_id}</div>
            <div className="fs-house-ownership-share">{ownership.share} %</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ProposalBox = props => {
  const { api, keyring } = useSubstrateState()
  const { setStatus } = props
  const [ currentProposalIndex, setCurrentProposalIndex] = useState(0)
  const [ proposals, setProposals] = useState([])

  const subscribeProposalIndex = () => {
    let unsub = null
    const fetch = () => {
      api.query.templateModule.proposalIndex(newValue => {
        setCurrentProposalIndex(newValue.toNumber())
      })
    }
    fetch()
    return () => {
      unsub && unsub()
    }
  }

  const subscribeProposals = () => {
    let unsub = null
    const asyncFetch = async () => {
      api.query.templateModule.proposals.entries().then((proposals) => {

        const proposalsMap = proposals.map(proposal => {

          let jsonProposal = proposal[1].toJSON();
          return {
            id: jsonProposal.id,
            house_id: jsonProposal.houseId,
            account_name: keyring.getPair(jsonProposal.accountId).meta.name,
            account_id: jsonProposal.accountId,
            valuation: jsonProposal.valuation,
            house_name: jsonProposal.houseName,
            active: jsonProposal.active,
            funded: jsonProposal.funded,
            vote_ok: jsonProposal.voteOkCount,
            vote_ko: jsonProposal.voteKoCount
          }
        })
        
        setProposals(proposalsMap)
      })
    }
    asyncFetch()
    return () => {
      unsub && unsub()
    }
  }

  useEffect(subscribeProposalIndex, [api.query.templateModule, keyring])
  useEffect(subscribeProposals, [api.query.templateModule, currentProposalIndex, proposals])

  return (
    <div className="proposal-box">
      <h2>Proposals</h2>
      <ProposalList setStatus={setStatus} proposals={proposals}/>
    </div>
  )
}


const ProposalForm = props => {
  const { houseId, setStatus } = props
  const [open, setOpen] = React.useState(false)
  const [formValue, setFormValue] = React.useState({})

  const confirmAndClose = unsub => {
    setOpen(false)
    if (unsub && typeof unsub === 'function') unsub()
  }

  const formChange = key => (ev, el) => {
    setFormValue({ ...formValue, [key]: el.value })
  }

  return (
    <div className="proposal-form">
      <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        trigger={
          <Button basic color="blue">
            Proposal
          </Button>
        }
      >
        <Modal.Header>House's Proposal</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Input fluid label="House ID" readOnly value={houseId} />
            <Form.Input
              fluid
              label="Amount of proposal"
              placeholder="Amount of proposal"
              onChange={formChange('target')}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button basic color="grey" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <TxButton
            label="Create proposal"
            type="SIGNED-TX"
            setStatus={setStatus}
            onClick={confirmAndClose}
            attrs={{
              palletRpc: 'templateModule',
              callable: 'createProposal',
              inputParams: [houseId, formValue.target],
              paramFields: [true, true],
            }}
          />
        </Modal.Actions>
      </Modal>
    </div>
  )
}

const ProposalList = props => {
  const { setStatus, proposals } = props

  return (
    <div className="proposal-list" style={{display: "flex", margin: "5px", flexWrap: "wrap"}}>
      {proposals.map((proposal, i) => (
        <Proposal key={i} setStatus={setStatus} id={proposal.id} 
          house_id={proposal.house_id} 
          account_id={proposal.account_id}
          account_name={proposal.account_name}
          valuation={proposal.valuation}
          house_name={proposal.house_name}
          active={proposal.active}
          funded={proposal.funded}
          vote_ok={proposal.vote_ok}
          vote_ko={proposal.vote_ko} />
      ))}
    </div>
  )
}

const Proposal = props => {
  const { setStatus, id, house_id, account_id, account_name, valuation, house_name, active, funded, vote_ok, vote_ko  } = props

  return (
    <div className="proposal" 
      style={{
        border: "1px solid gray", 
        margin: "5px",
        padding: "5px",
        flexGrow: "1",
        flex: "1"
    }}>
      <div>Proposal : {id}</div>
      <div>Account : {account_name}</div>
      <div>
        <span>House Id : {house_id}</span> &nbsp;
        <span>House's Name : {house_name}</span>
      </div>
      <div>Valuation : {valuation}</div>
      <div>Active : {active ? 'Yes' : 'No'}</div>
      <div>Funded : {funded ? 'Yes' : 'No'}</div>
      <div>
        <span>Votes Yes : {vote_ok}</span>
      </div>
      <div>
        <span>Votes No : {vote_ko}</span>
      </div>
      <div style={{ display: active ? '' : 'none'}}><VoteForm setStatus={setStatus} proposal_id={id} /></div>
      <div style={{ display: active ? '' : 'none'}}><ManageProposalForm setStatus={setStatus} proposal_id={id} house_id={house_id} account_id={account_id} /></div>
    </div>
  )
}

const ManageProposalForm = props => {
  const {setStatus, proposal_id, house_id, account_id} = props
  const [open, setOpen] = React.useState(false)

  const confirmAndClose = unsub => {
    setOpen(false)
    if (unsub && typeof unsub === 'function') unsub()
  }

  return (
    <div className="vote-form">
      <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        trigger={
          <Button basic color="blue">
            Manage
          </Button>
        }
      >
        <Modal.Header>Manage House's Proposal</Modal.Header>
        <Modal.Content>
          <span>Process the proposal to accept or reject the house distribution between investors?</span>
        </Modal.Content>
        <Modal.Actions>
        <Button basic color="grey" onClick={() => setOpen(false)}>
            Cancel
        </Button>
        <TxButton
          label="Manage"
          type="SIGNED-TX"
          setStatus={setStatus}
          onClick={confirmAndClose}
          attrs={{
            palletRpc: 'templateModule',
            callable: 'manageProposal',
            inputParams: [house_id, account_id, proposal_id],
            paramFields: [true, true, true],
          }}
        />
        </Modal.Actions>
      </Modal>
    </div>
  )
}

const VoteForm = props => {
  const {setStatus, proposal_id} = props
  const [open, setOpen] = React.useState(false)

  const confirmAndClose = unsub => {
    setOpen(false)
    if (unsub && typeof unsub === 'function') unsub()
  }

  return (
    <div className="vote-form">
      <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        trigger={
          <Button basic color="blue">
            Vote
          </Button>
        }
      >
        <Modal.Header>House's Proposal</Modal.Header>
        <Modal.Content>
          
        </Modal.Content>
        <Modal.Actions>
          <TxButton
            label="Yes"
            type="SIGNED-TX"
            setStatus={setStatus}
            onClick={confirmAndClose}
            attrs={{
              palletRpc: 'templateModule',
              callable: 'voteProposal',
              inputParams: [proposal_id, true],
              paramFields: [true, true],
            }}
          />
          <TxButton
            label="No"
            type="SIGNED-TX"
            setStatus={setStatus}
            onClick={confirmAndClose}
            attrs={{
              palletRpc: 'templateModule',
              callable: 'voteProposal',
              inputParams: [proposal_id, false],
              paramFields: [true, true],
            }}
          />
        </Modal.Actions>
      </Modal>
    </div>
  )
}

export default function TemplateModule(props) {
  const { api } = useSubstrateState()
  return api.query.templateModule && api.query.templateModule.something ? (
    <Main {...props} />
  ) : null
}
