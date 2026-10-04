import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { AgentStateAnnotation } from './state.js';
import { understandNode } from '../nodes/understand.js';
import { planNode } from '../nodes/plan.js';
import { decideNode } from '../nodes/decide.js';
import { policyGateNode } from '../nodes/policy_gate.js';
import { executeNode } from '../nodes/execute.js';
import { observeNode } from '../nodes/observe.js';
import { reflectNode } from '../nodes/reflect.js';
import { verifyNode } from '../nodes/verify.js';
import { finalizeNode } from '../nodes/finalize.js';
import { askHumanNode } from '../nodes/ask_human.js';

/**
 * Build and compile the CentrAlign Autonomous Task Worker LangGraph workflow
 * @param {Object} [options]
 * @param {MemorySaver} [options.checkpointer]
 * @returns {import('@langchain/langgraph').CompiledStateGraph}
 */
export function createAgentWorkflow(options = {}) {
  const checkpointer = options.checkpointer || new MemorySaver();

  const workflow = new StateGraph(AgentStateAnnotation)
    // Register all 10 modular nodes with node_ prefix to avoid channel name collision
    .addNode('node_understand', understandNode)
    .addNode('node_plan', planNode)
    .addNode('node_decide', decideNode)
    .addNode('node_policy_gate', policyGateNode)
    .addNode('node_execute', executeNode)
    .addNode('node_observe', observeNode)
    .addNode('node_reflect', reflectNode)
    .addNode('node_verify', verifyNode)
    .addNode('node_finalize', finalizeNode)
    .addNode('node_ask_human', askHumanNode)

    // Flow from START
    .addEdge(START, 'node_understand')

    // Branch from understand
    .addConditionalEdges('node_understand', (state) => {
      if (state.pendingQuestion) return 'node_ask_human';
      return 'node_plan';
    })

    // From ask_human, continue to plan
    .addEdge('node_ask_human', 'node_plan')

    // From plan, enter ReAct cycle
    .addEdge('node_plan', 'node_decide')

    // From decide, proceed to policy gate
    .addEdge('node_decide', 'node_policy_gate')

    // Policy gate route
    .addConditionalEdges('node_policy_gate', (state) => {
      if (state.status === 'failed' || (state.policyDecision && !state.policyDecision.allowed)) {
        return 'node_finalize';
      }
      return 'node_execute';
    })

    // Execute -> Observe -> Reflect
    .addEdge('node_execute', 'node_observe')
    .addEdge('node_observe', 'node_reflect')

    // Branch from reflect
    .addConditionalEdges('node_reflect', (state) => {
      if (state.nextDecision === 'verify') return 'node_verify';
      if (state.nextDecision === 'replan') return 'node_plan';
      if (state.nextDecision === 'ask_human') return 'node_ask_human';
      return 'node_decide';
    })

    // Branch from verify
    .addConditionalEdges('node_verify', (state) => {
      if (state.status === 'completed' || state.status === 'failed') {
        return 'node_finalize';
      }
      return 'node_decide';
    })

    // Finalize ends the run
    .addEdge('node_finalize', END);

  return workflow.compile({ checkpointer });
}
