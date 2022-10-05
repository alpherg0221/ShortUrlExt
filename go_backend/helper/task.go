package helper

import (
	"fmt"
	"log"

	"example.com/backend/protobuf"
)

type TaskManager struct {
	queue   chan Task
	workers map[string]struct{}
	cache   map[string]*protobuf.Trace
}

type Task struct {
	*protobuf.Request
	Done  chan *protobuf.Trace
	Err   chan error
	cache map[string]protobuf.Trace
}

var instance = &TaskManager{
	queue:   make(chan Task, 10),
	workers: make(map[string]struct{}),
	cache:   make(map[string]*protobuf.Trace),
}

func TaskManagerInstance() *TaskManager {
	return instance
}

func (tm *TaskManager) Handle(r *protobuf.Request) (*protobuf.Trace, error) {
	if len(tm.workers) < 1 {
		return &protobuf.Trace{}, fmt.Errorf("no workers")
	}
	done := make(chan *protobuf.Trace)
	errChan := make(chan error, 10)
	tm.queue <- Task{
		Request: r,
		Done:    done,
		Err:     errChan,
	}
	go func() {
		select {
		case <-done: // 2度目はcloseだけと考える
			return
		case err := <-errChan:
			if err != nil {
				log.Println(err.Error())
			}
		}
	}()
	select {
	case ret := <-done:
		return ret, nil
	case err := <-errChan:
		return &protobuf.Trace{}, err
	}
}

func (tm *TaskManager) WaitQueue() Task {
	return <-tm.queue
}

func (tm *TaskManager) AddWorker(id string) error {
	if _, exist := tm.workers[id]; exist {
		return fmt.Errorf("duplicated id")
	}
	tm.workers[id] = struct{}{}
	return nil
}

func (tm *TaskManager) RemoveWorker(id string) error {
	if _, exist := tm.workers[id]; !exist {
		return fmt.Errorf("id not found")
	}
	delete(tm.workers, id)
	return nil
}

func (tm *TaskManager) CacheStore(token string, trace *protobuf.Trace) {
	clone := &protobuf.Trace{
		From:      fmt.Sprint(trace.From),
		Term:      fmt.Sprint(trace.From),
		Chains:    []string{},
		Thumnbail: trace.Thumnbail,
		Info: &protobuf.Info{
			Title:       fmt.Sprint(trace.Info.Title),
			Description: fmt.Sprint(trace.Info.Description),
		},
	}
	for _, v := range trace.Chains {
		clone.Chains = append(clone.Chains, v)
	}
	tm.cache[token] = clone
}

func (tm *TaskManager) CacheLoad(token string) *protobuf.Trace {
	if _, exist := tm.cache[token]; !exist {
		return nil
	}
	return tm.cache[token]
}
