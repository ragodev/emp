package strongmessage

import (
  "fmt"
  zmq "github.com/alecthomas/gozmq"
  "strongmessage/config"
	"strongmessage/objects"
)

func BootstrapNetwork(log_channel chan string, message_channel chan objects.Message) {
	peers := config.LoadPeers(log_channel)
	if peers == nil {
		log_channel <- "Failed to load peers.json"
	} else {
		context, err := zmq.NewContext()
		if err != nil {
			log_channel <- "Error creating ZMQ context"
			log_channel <- err.Error()
		} else {
			for _, v := range peers {
				go v.Subscribe(log_channel, message_channel, context)
			}
		}
	}
}

func StartPubServer(log chan string, message_channel chan objects.Message) error {
	context, err := zmq.NewContext()
	if err != nil {
		log <- "Error creating ZMQ context"
		log <- err.Error()
    return err
	} else {
		socket, err := context.NewSocket(zmq.PUB)
		if err != nil {
			log <- "Error creating socket."
			log <- err.Error()
		}
		socket.Bind("tcp://127.0.0.1:5000")
		for {
			message := <- message_channel
			bytes := message.GetBytes(log)
			socket.Send(bytes, 0)
		}
    return nil
	}
}

func BlockingLogger(channel chan string) {
	for {
		log_message := <-channel
		fmt.Println(log_message)
	}
}