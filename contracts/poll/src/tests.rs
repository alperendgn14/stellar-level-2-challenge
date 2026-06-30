#![cfg(test)]

use super::*;
use soroban_sdk::{vec, Env, String, Address};

#[test]
fn test_create_and_vote() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PollContract);
    let client = PollContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let voter = Address::generate(&env);

    env.mock_all_auths();

    let question = String::from_str(&env, "Best Stellar wallet?");
    let options = vec![
        &env,
        String::from_str(&env, "Freighter"),
        String::from_str(&env, "Albedo"),
        String::from_str(&env, "xBull"),
    ];

    let poll_id = client.create_poll(&creator, &question, &options, &(86400 * 7));

    let poll = client.get_poll(&poll_id);
    assert_eq!(poll.question, question);
    assert_eq!(poll.options.len(), 3);
    assert_eq!(poll.total_votes, 0);

    client.vote(&voter, &poll_id, &0);
    client.vote(&Address::generate(&env), &poll_id, &1);
    client.vote(&Address::generate(&env), &poll_id, &2);

    let poll = client.get_poll(&poll_id);
    assert_eq!(poll.total_votes, 3);
    assert_eq!(poll.options.get(0).unwrap().count, 1);
    assert_eq!(poll.options.get(1).unwrap().count, 1);
    assert_eq!(poll.options.get(2).unwrap().count, 1);

    assert!(client.has_voted(&poll_id, &voter));
    assert!(!client.has_voted(&poll_id, &Address::generate(&env)));
}

#[test]
#[should_panic(expected = "Already voted")]
fn test_double_vote() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PollContract);
    let client = PollContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let voter = Address::generate(&env);
    env.mock_all_auths();

    let poll_id = client.create_poll(
        &creator,
        &String::from_str(&env, "Test?"),
        &vec![
            &env,
            String::from_str(&env, "Yes"),
            String::from_str(&env, "No"),
        ],
        &86400,
    );

    client.vote(&voter, &poll_id, &0);
    client.vote(&voter, &poll_id, &0);
}

#[test]
#[should_panic(expected = "Invalid option")]
fn test_invalid_option() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PollContract);
    let client = PollContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let voter = Address::generate(&env);
    env.mock_all_auths();

    let poll_id = client.create_poll(
        &creator,
        &String::from_str(&env, "Test?"),
        &vec![
            &env,
            String::from_str(&env, "Yes"),
            String::from_str(&env, "No"),
        ],
        &86400,
    );

    client.vote(&voter, &poll_id, &5);
}
