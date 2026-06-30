#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec, IntoVal};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PollOption {
    pub name: String,
    pub count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Poll {
    pub id: String,
    pub question: String,
    pub options: Vec<PollOption>,
    pub creator: Address,
    pub end_time: u64,
    pub total_votes: u32,
}

#[contracttype]
pub enum DataKey {
    PollCount,
    Poll(String),
    HasVoted(String, Address),
    VoterPolls(Address),
}

#[contract]
pub struct PollContract;

#[contractimpl]
impl PollContract {
    pub fn create_poll(
        env: Env,
        creator: Address,
        question: String,
        option_names: Vec<String>,
        duration_secs: u64,
    ) -> String {
        creator.require_auth();

        let count: u32 = env.storage().instance().get(&DataKey::PollCount).unwrap_or(0);
        let poll_id = String::from_str(&env, &format!("poll_{}", count + 1));
        let end_time = env.ledger().timestamp() + duration_secs;

        let mut options: Vec<PollOption> = Vec::new(&env);
        for name in option_names.iter() {
            options.push_back(PollOption {
                name,
                count: 0,
            });
        }

        let poll = Poll {
            id: poll_id.clone(),
            question,
            options,
            creator,
            end_time,
            total_votes: 0,
        };

        env.storage().instance().set(&DataKey::PollCount, &(count + 1));
        env.storage().instance().set(&DataKey::Poll(poll_id.clone()), &poll);

        env.events().publish(
            (symbol_short!("PCREATE"), poll_id.clone()),
            poll_id.clone(),
        );

        poll_id
    }

    pub fn vote(env: Env, voter: Address, poll_id: String, option_index: u32) {
        voter.require_auth();

        let mut poll = env
            .storage()
            .instance()
            .get(&DataKey::Poll(poll_id.clone()))
            .expect("Poll not found");

        if env.ledger().timestamp() > poll.end_time {
            panic!("Poll has ended");
        }

        let vote_key = DataKey::HasVoted(poll_id.clone(), voter.clone());
        if env.storage().instance().has(&vote_key) {
            panic!("Already voted");
        }

        let option_count = poll.options.len();
        if option_index >= option_count {
            panic!("Invalid option");
        }

        let mut option = poll.options.get(option_index).unwrap();
        option.count += 1;
        poll.options.set(option_index, option);
        poll.total_votes += 1;

        env.storage().instance().set(&DataKey::Poll(poll_id.clone()), &poll);
        env.storage().instance().set(&vote_key, &true);

        let mut voter_polls = env
            .storage()
            .instance()
            .get(&DataKey::VoterPolls(voter.clone()))
            .unwrap_or(Vec::new(&env));

        voter_polls.push_back(poll_id.clone());
        env.storage()
            .instance()
            .set(&DataKey::VoterPolls(voter), &voter_polls);

        env.events().publish(
            (symbol_short!("VCAST"), poll_id, option_index as u32),
            true,
        );
    }

    pub fn get_poll(env: Env, poll_id: String) -> Poll {
        env.storage()
            .instance()
            .get(&DataKey::Poll(poll_id))
            .expect("Poll not found")
    }

    pub fn get_poll_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::PollCount).unwrap_or(0)
    }

    pub fn has_voted(env: Env, poll_id: String, voter: Address) -> bool {
        env.storage()
            .instance()
            .has(&DataKey::HasVoted(poll_id, voter))
    }

    pub fn get_voter_polls(env: Env, voter: Address) -> Vec<String> {
        env.storage()
            .instance()
            .get(&DataKey::VoterPolls(voter))
            .unwrap_or(Vec::new(&env))
    }
}

#[cfg(test)]
mod tests;
