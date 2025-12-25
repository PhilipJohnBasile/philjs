//! Channel utilities for async communication

use tokio::sync::{mpsc, oneshot, broadcast as tokio_broadcast, watch as tokio_watch};
use std::fmt;

/// Create a bounded channel
pub fn channel<T>(capacity: usize) -> (Sender<T>, Receiver<T>) {
    let (tx, rx) = mpsc::channel(capacity);
    (Sender::new(tx), Receiver::new(rx))
}

/// Create a broadcast channel
pub fn broadcast<T: Clone>(capacity: usize) -> (BroadcastSender<T>, BroadcastReceiver<T>) {
    let (tx, rx) = tokio_broadcast::channel(capacity);
    (BroadcastSender::new(tx), BroadcastReceiver::new(rx))
}

/// Create a watch channel
pub fn watch<T>(initial: T) -> (WatchSender<T>, WatchReceiver<T>) {
    let (tx, rx) = tokio_watch::channel(initial);
    (WatchSender::new(tx), WatchReceiver::new(rx))
}

/// Channel trait for unified interface
pub trait Channel<T> {
    /// The sender type
    type Sender;
    /// The receiver type
    type Receiver;

    /// Create a new channel
    fn create(capacity: usize) -> (Self::Sender, Self::Receiver);
}

/// Sender wrapper
pub struct Sender<T> {
    inner: mpsc::Sender<T>,
}

impl<T> Sender<T> {
    /// Create a new sender
    pub fn new(inner: mpsc::Sender<T>) -> Self {
        Self { inner }
    }

    /// Send a value
    pub async fn send(&self, value: T) -> Result<(), ChannelError<T>> {
        self.inner.send(value).await.map_err(|e| ChannelError::SendError(e.0))
    }

    /// Try to send a value without waiting
    pub fn try_send(&self, value: T) -> Result<(), ChannelError<T>> {
        self.inner.try_send(value).map_err(|e| match e {
            mpsc::error::TrySendError::Full(v) => ChannelError::Full(v),
            mpsc::error::TrySendError::Closed(v) => ChannelError::Closed(v),
        })
    }

    /// Check if the channel is closed
    pub fn is_closed(&self) -> bool {
        self.inner.is_closed()
    }

    /// Get the current capacity
    pub fn capacity(&self) -> usize {
        self.inner.capacity()
    }

    /// Wait for capacity
    pub async fn reserve(&self) -> Result<mpsc::Permit<'_, T>, ChannelError<()>> {
        self.inner.reserve().await.map_err(|_| ChannelError::Closed(()))
    }
}

impl<T> Clone for Sender<T> {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

/// Receiver wrapper
pub struct Receiver<T> {
    inner: mpsc::Receiver<T>,
}

impl<T> Receiver<T> {
    /// Create a new receiver
    pub fn new(inner: mpsc::Receiver<T>) -> Self {
        Self { inner }
    }

    /// Receive a value
    pub async fn recv(&mut self) -> Option<T> {
        self.inner.recv().await
    }

    /// Try to receive without waiting
    pub fn try_recv(&mut self) -> Result<T, TryRecvError> {
        self.inner.try_recv().map_err(|e| match e {
            mpsc::error::TryRecvError::Empty => TryRecvError::Empty,
            mpsc::error::TryRecvError::Disconnected => TryRecvError::Disconnected,
        })
    }

    /// Close the receiving end
    pub fn close(&mut self) {
        self.inner.close();
    }
}

/// Broadcast sender
pub struct BroadcastSender<T> {
    inner: tokio_broadcast::Sender<T>,
}

impl<T: Clone> BroadcastSender<T> {
    /// Create a new broadcast sender
    pub fn new(inner: tokio_broadcast::Sender<T>) -> Self {
        Self { inner }
    }

    /// Send a value to all receivers
    pub fn send(&self, value: T) -> Result<usize, ChannelError<T>> {
        self.inner.send(value).map_err(|e| ChannelError::SendError(e.0))
    }

    /// Subscribe to the broadcast
    pub fn subscribe(&self) -> BroadcastReceiver<T> {
        BroadcastReceiver::new(self.inner.subscribe())
    }

    /// Get the number of receivers
    pub fn receiver_count(&self) -> usize {
        self.inner.receiver_count()
    }
}

impl<T> Clone for BroadcastSender<T> {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

/// Broadcast receiver
pub struct BroadcastReceiver<T> {
    inner: tokio_broadcast::Receiver<T>,
}

impl<T: Clone> BroadcastReceiver<T> {
    /// Create a new broadcast receiver
    pub fn new(inner: tokio_broadcast::Receiver<T>) -> Self {
        Self { inner }
    }

    /// Receive a value
    pub async fn recv(&mut self) -> Result<T, BroadcastRecvError> {
        self.inner.recv().await.map_err(|e| match e {
            tokio_broadcast::error::RecvError::Closed => BroadcastRecvError::Closed,
            tokio_broadcast::error::RecvError::Lagged(n) => BroadcastRecvError::Lagged(n),
        })
    }

    /// Try to receive without waiting
    pub fn try_recv(&mut self) -> Result<T, TryRecvError> {
        self.inner.try_recv().map_err(|e| match e {
            tokio_broadcast::error::TryRecvError::Empty => TryRecvError::Empty,
            tokio_broadcast::error::TryRecvError::Closed => TryRecvError::Disconnected,
            tokio_broadcast::error::TryRecvError::Lagged(_) => TryRecvError::Empty,
        })
    }
}

/// Watch sender (single producer, multiple consumer with latest value)
pub struct WatchSender<T> {
    inner: tokio_watch::Sender<T>,
}

impl<T> WatchSender<T> {
    /// Create a new watch sender
    pub fn new(inner: tokio_watch::Sender<T>) -> Self {
        Self { inner }
    }

    /// Send a new value
    pub fn send(&self, value: T) -> Result<(), ChannelError<T>> {
        self.inner.send(value).map_err(|e| ChannelError::SendError(e.0))
    }

    /// Modify the value
    pub fn send_modify<F>(&self, f: F)
    where
        F: FnOnce(&mut T),
    {
        self.inner.send_modify(f);
    }

    /// Subscribe to changes
    pub fn subscribe(&self) -> WatchReceiver<T> {
        WatchReceiver::new(self.inner.subscribe())
    }

    /// Check if there are any receivers
    pub fn is_closed(&self) -> bool {
        self.inner.is_closed()
    }
}

/// Watch receiver
pub struct WatchReceiver<T> {
    inner: tokio_watch::Receiver<T>,
}

impl<T: Clone> WatchReceiver<T> {
    /// Create a new watch receiver
    pub fn new(inner: tokio_watch::Receiver<T>) -> Self {
        Self { inner }
    }

    /// Get the current value
    pub fn borrow(&self) -> tokio_watch::Ref<'_, T> {
        self.inner.borrow()
    }

    /// Get a clone of the current value
    pub fn get(&self) -> T {
        self.inner.borrow().clone()
    }

    /// Wait for a change
    pub async fn changed(&mut self) -> Result<(), WatchError> {
        self.inner.changed().await.map_err(|_| WatchError::Closed)
    }

    /// Wait for a change and get the new value
    pub async fn wait_for_change(&mut self) -> Result<T, WatchError> {
        self.changed().await?;
        Ok(self.get())
    }
}

impl<T> Clone for WatchReceiver<T> {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

/// Channel error
#[derive(Debug)]
pub enum ChannelError<T> {
    /// Send error - channel closed
    SendError(T),
    /// Channel is full
    Full(T),
    /// Channel is closed
    Closed(T),
}

impl<T: fmt::Debug> fmt::Display for ChannelError<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ChannelError::SendError(_) => write!(f, "Channel send error"),
            ChannelError::Full(_) => write!(f, "Channel is full"),
            ChannelError::Closed(_) => write!(f, "Channel is closed"),
        }
    }
}

impl<T: fmt::Debug> std::error::Error for ChannelError<T> {}

/// Try receive error
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TryRecvError {
    /// No messages available
    Empty,
    /// Channel disconnected
    Disconnected,
}

impl fmt::Display for TryRecvError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TryRecvError::Empty => write!(f, "Channel is empty"),
            TryRecvError::Disconnected => write!(f, "Channel disconnected"),
        }
    }
}

impl std::error::Error for TryRecvError {}

/// Broadcast receive error
#[derive(Debug, Clone, Copy)]
pub enum BroadcastRecvError {
    /// Channel closed
    Closed,
    /// Receiver lagged behind
    Lagged(u64),
}

impl fmt::Display for BroadcastRecvError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            BroadcastRecvError::Closed => write!(f, "Broadcast channel closed"),
            BroadcastRecvError::Lagged(n) => write!(f, "Receiver lagged by {} messages", n),
        }
    }
}

impl std::error::Error for BroadcastRecvError {}

/// Watch error
#[derive(Debug, Clone, Copy)]
pub enum WatchError {
    /// Sender closed
    Closed,
}

impl fmt::Display for WatchError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Watch sender closed")
    }
}

impl std::error::Error for WatchError {}

/// One-shot channel for single value
pub struct OneShotChannel<T> {
    tx: Option<oneshot::Sender<T>>,
    rx: Option<oneshot::Receiver<T>>,
}

impl<T> OneShotChannel<T> {
    /// Create a new one-shot channel
    pub fn new() -> Self {
        let (tx, rx) = oneshot::channel();
        Self {
            tx: Some(tx),
            rx: Some(rx),
        }
    }

    /// Take the sender
    pub fn take_sender(&mut self) -> Option<oneshot::Sender<T>> {
        self.tx.take()
    }

    /// Take the receiver
    pub fn take_receiver(&mut self) -> Option<oneshot::Receiver<T>> {
        self.rx.take()
    }

    /// Split into sender and receiver
    pub fn split(mut self) -> (oneshot::Sender<T>, oneshot::Receiver<T>) {
        (self.tx.take().unwrap(), self.rx.take().unwrap())
    }
}

impl<T> Default for OneShotChannel<T> {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_channel() {
        let (tx, mut rx) = channel(10);

        tx.send(42).await.unwrap();
        let value = rx.recv().await.unwrap();
        assert_eq!(value, 42);
    }

    #[tokio::test]
    async fn test_broadcast() {
        let (tx, mut rx1) = broadcast(10);
        let mut rx2 = tx.subscribe();

        tx.send(42).unwrap();

        let v1 = rx1.recv().await.unwrap();
        let v2 = rx2.recv().await.unwrap();

        assert_eq!(v1, 42);
        assert_eq!(v2, 42);
    }

    #[tokio::test]
    async fn test_watch() {
        let (tx, mut rx) = watch(0);

        tx.send(42).unwrap();

        assert_eq!(rx.get(), 42);

        tx.send_modify(|v| *v += 1);
        rx.changed().await.unwrap();

        assert_eq!(rx.get(), 43);
    }
}
