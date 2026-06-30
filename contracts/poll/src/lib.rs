#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PollOption {
    pub name: String,
    pub count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Poll {
    pub id: u32,
    pub question: String,
    pub options: Vec<PollOption>,
    pub creator: Address,
    pub end_time: u64,
    pub total_votes: u32,
}

#[contracttype]
pub enum DataKey {
    PollCount,
    Poll(u32),
    HasVoted(u32, Address),
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
    ) -> u32 {
        creator.require_auth();

        let id: u32 = env.storage().instance().get(&DataKey::PollCount).unwrap_or(0);
        let next_id = id + 1;
        let end_time = env.ledger().timestamp() + duration_secs;

        let mut options: Vec<PollOption> = Vec::new(&env);
        for name in option_names.iter() {
            options.push_back(PollOption {
                name,
                count: 0,
            });
        }

        let poll = Poll {
            id: next_id,
            question,
            options,
            creator,
            end_time,
            total_votes: 0,
        };

        env.storage().instance().set(&DataKey::PollCount, &next_id);
        env.storage().instance().set(&DataKey::Poll(next_id), &poll);

        env.events().publish(
            (symbol_short!("PCREATE"), next_id),
            next_id,
        );

        next_id
    }

    pub fn vote(env: Env, voter: Address, poll_id: u32, option_index: u32) {
        voter.require_auth();

        let mut poll: Poll = env
            .storage()
            .instance()
            .get(&DataKey::Poll(poll_id))
            .expect("Poll not found");

        if env.ledger().timestamp() > poll.end_time {
            panic!("Poll has ended");
        }

        if env.storage().instance().has(&DataKey::HasVoted(poll_id, voter.clone())) {
            panic!("Already voted");
        }

        if option_index >= poll.options.len() {
            panic!("Invalid option");
        }

        let mut option = poll.options.get(option_index).unwrap();
        option.count += 1;
        poll.options.set(option_index, option);
        poll.total_votes += 1;

        env.storage().instance().set(&DataKey::Poll(poll_id), &poll);
        env.storage().instance().set(&DataKey::HasVoted(poll_id, voter), &true);

        env.events().publish(
            (symbol_short!("VCAST"), poll_id, option_index),
            true,
        );
    }

    pub fn get_poll(env: Env, poll_id: u32) -> Poll {
        env.storage()
            .instance()
            .get(&DataKey::Poll(poll_id))
            .expect("Poll not found")
    }

    pub fn get_poll_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::PollCount).unwrap_or(0)
    }

    pub fn has_voted(env: Env, poll_id: u32, voter: Address) -> bool {
        env.storage()
            .instance()
            .has(&DataKey::HasVoted(poll_id, voter))
    }
}
