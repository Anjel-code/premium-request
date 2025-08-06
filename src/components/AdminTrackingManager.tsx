import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, GripVertical, MapPin, Clock } from "lucide-react";
import { TrackingEvent } from "@/lib/storeUtils";

// Drag and drop functionality
const useDragAndDrop = (
  items: TrackingEvent[],
  onReorder: (items: TrackingEvent[]) => void
) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) return;

    const draggedEvent = items[draggedItem];
    const dropEvent = items[dropIndex];

    // Don't allow dropping if it would break the required order
    if (
      draggedEvent.location === "Quibble" ||
      draggedEvent.location === "Customer"
    ) {
      return;
    }

    // Don't allow dropping before Quibble or after Customer
    if (dropEvent.location === "Quibble" && dropIndex === 0) {
      return; // Can't drop before Quibble
    }

    if (dropEvent.location === "Customer" && dropIndex === items.length - 1) {
      return; // Can't drop after Customer
    }

    const newItems = [...items];
    const [draggedElement] = newItems.splice(draggedItem, 1);
    newItems.splice(dropIndex, 0, draggedElement);

    onReorder(newItems);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return {
    draggedItem,
    dragOverItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
};

interface AdminTrackingManagerProps {
  trackingHistory: TrackingEvent[];
  onSaveTrackingHistory: (events: TrackingEvent[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AdminTrackingManager: React.FC<AdminTrackingManagerProps> = ({
  trackingHistory,
  onSaveTrackingHistory,
  isOpen,
  onClose,
}) => {
  const [events, setEvents] = useState<TrackingEvent[]>(trackingHistory);
  const [editingEvent, setEditingEvent] = useState<TrackingEvent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleReorder = (newEvents: TrackingEvent[]) => {
    setEvents(newEvents);
  };

  const {
    draggedItem,
    dragOverItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop(events, handleReorder);

  // Form states for editing
  const [eventLocation, setEventLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [eventStatus, setEventStatus] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventTimestamp, setEventTimestamp] = useState("");

  const handleAddEvent = () => {
    const newEvent: TrackingEvent = {
      id: `event_${Date.now()}`,
      timestamp: new Date(),
      location: "New Location",
      status: "In Transit",
      description: "Package status update",
    };
    setEditingEvent(newEvent);
    setEventLocation(newEvent.location);
    setCustomLocation("");
    setEventStatus(newEvent.status);
    setEventDescription(newEvent.description);
    setEventTimestamp(newEvent.timestamp.toISOString().slice(0, 16));
    setIsEditDialogOpen(true);
  };

  const handleEditEvent = (event: TrackingEvent) => {
    setEditingEvent(event);
    setEventLocation(event.location);
    setCustomLocation("");
    setEventStatus(event.status);
    setEventDescription(event.description);
    setEventTimestamp(event.timestamp.toISOString().slice(0, 16));
    setIsEditDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  const handleSaveEvent = () => {
    if (!editingEvent || !eventLocation || !eventStatus || !eventDescription)
      return;

    const updatedEvent: TrackingEvent = {
      ...editingEvent,
      location: eventLocation === "Custom" ? customLocation : eventLocation,
      status: eventStatus,
      description: eventDescription,
      timestamp: new Date(eventTimestamp || Date.now()),
    };

    if (editingEvent.id.startsWith("event_")) {
      // New event
      setEvents([...events, updatedEvent]);
    } else {
      // Existing event
      setEvents(
        events.map((event) =>
          event.id === editingEvent.id ? updatedEvent : event
        )
      );
    }

    setIsEditDialogOpen(false);
    setEditingEvent(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Sort events to ensure proper order: Quibble -> Distribution Center -> Customer
      const sortedEvents = [...events].sort((a, b) => {
        // Customer should always be last
        if (a.location === "Customer") return 1;
        if (b.location === "Customer") return -1;

        // Quibble should always be first
        if (a.location === "Quibble") return -1;
        if (b.location === "Quibble") return 1;

        // Distribution Center should be second
        if (a.location === "Distribution Center") return -1;
        if (b.location === "Distribution Center") return 1;

        // For other events, sort by timestamp (oldest first for timeline)
        return a.timestamp.getTime() - b.timestamp.getTime();
      });
      await onSaveTrackingHistory(sortedEvents);
      onClose();
    } catch (error) {
      console.error("Error saving tracking history:", error);
    } finally {
      setSaving(false);
    }
  };

  const moveEvent = (fromIndex: number, toIndex: number) => {
    const newEvents = [...events];
    const [movedEvent] = newEvents.splice(fromIndex, 1);
    newEvents.splice(toIndex, 0, movedEvent);
    setEvents(newEvents);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Tracking Timeline</DialogTitle>
          <DialogDescription>
            Add, edit, and reorder tracking events. Drag events to reorder them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Event Button */}
          <Button onClick={handleAddEvent} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add New Tracking Event
          </Button>

          {/* Events List */}
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  No tracking events yet. Add your first event to get started.
                </p>
              </div>
            ) : (
              events.map((event, index) => (
                <Card
                  key={event.id}
                  className={`border shadow-sm transition-all ${
                    draggedItem === index ? "opacity-50 scale-95" : ""
                  } ${
                    dragOverItem === index ? "border-primary bg-primary/5" : ""
                  }`}
                  draggable={
                    event.location !== "Quibble" &&
                    event.location !== "Customer"
                  }
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Drag Handle */}
                      <div
                        className={`text-muted-foreground ${
                          event.location !== "Quibble" &&
                          event.location !== "Customer"
                            ? "cursor-move hover:text-primary"
                            : "cursor-not-allowed opacity-50"
                        }`}
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>

                      {/* Event Info */}
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary">
                            {event.location}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {event.location === "Customer" &&
                            event.status !== "Delivered" ? (
                              "Pending"
                            ) : (
                              <>
                                {event.timestamp.toLocaleDateString()}{" "}
                                {event.timestamp.toLocaleTimeString()}
                              </>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {event.status}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {event.description}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditEvent(event)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteEvent(event.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>

        {/* Edit Event Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEvent?.id.startsWith("event_")
                  ? "Add New Event"
                  : "Edit Event"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Select value={eventLocation} onValueChange={setEventLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quibble">Quibble</SelectItem>
                    <SelectItem value="Distribution Center">
                      Distribution Center
                    </SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Custom">Custom Location</SelectItem>
                  </SelectContent>
                </Select>
                {eventLocation === "Custom" && (
                  <Input
                    id="customLocation"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Enter custom location"
                    className="mt-2"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={eventStatus} onValueChange={setEventStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Order Processed">
                      Order Processed
                    </SelectItem>
                    <SelectItem value="Package Picked Up">
                      Package Picked Up
                    </SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="Out for Delivery">
                      Out for Delivery
                    </SelectItem>
                    <SelectItem value="To Be Delivered">
                      To Be Delivered
                    </SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Describe what happened at this location"
                />
              </div>
              <div>
                <Label htmlFor="timestamp">Timestamp</Label>
                <Input
                  id="timestamp"
                  type="datetime-local"
                  value={eventTimestamp}
                  onChange={(e) => setEventTimestamp(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEvent}>Save Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default AdminTrackingManager;
